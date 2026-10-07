/**
 * Tests for app/api/tests/[id]/route.ts
 */
import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/tests/[id]/route';

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database module
jest.mock('@/lib/database', () => ({
  getTest: jest.fn(),
  getTestOwner: jest.fn(),
  deleteTest: jest.fn(),
}));

import { auth } from '@/auth';
import { getTest, getTestOwner, deleteTest } from '@/lib/database';

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<any>>;
const mockGetTest = getTest as jest.MockedFunction<typeof getTest>;
const mockGetTestOwner = getTestOwner as jest.MockedFunction<typeof getTestOwner>;
const mockDeleteTest = deleteTest as jest.MockedFunction<typeof deleteTest>;

function mockSession(userId: string, email: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, email },
  } as any);
}

describe('GET /api/tests/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleTest = {
    id: 'test-1',
    year: 2023,
    title: 'Anatomy Test',
    topic: 'Anatomy and Physiology',
    difficulty: 'Invitational',
    totalTime: 3600,
    totalPoints: 100,
    questions: [],
  };

  test('returns test when found', async () => {
    mockGetTest.mockResolvedValue(sampleTest as any);

    const request = new NextRequest('http://localhost:3000/api/tests/test-1');
    const response = await GET(request, { params: { id: 'test-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.test).toEqual(sampleTest);
    expect(mockGetTest).toHaveBeenCalledWith('test-1');
  });

  test('returns 404 when test not found', async () => {
    mockGetTest.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/tests/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Test not found');
  });

  test('returns 500 on database error', async () => {
    mockGetTest.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/tests/test-1');
    const response = await GET(request, { params: { id: 'test-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch test from database');
  });
});

describe('DELETE /api/tests/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as any);

    const request = new NextRequest('http://localhost:3000/api/tests/test-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'test-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
    expect(mockDeleteTest).not.toHaveBeenCalled();
  });

  test('returns 404 when test not found', async () => {
    mockSession('user-1', 'user@example.com');
    mockGetTestOwner.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/tests/test-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'test-1' } });

    expect(response.status).toBe(404);
    expect(mockDeleteTest).not.toHaveBeenCalled();
  });

  test('returns 403 when test belongs to another user', async () => {
    mockSession('user-1', 'user@example.com');
    mockGetTestOwner.mockResolvedValue({ userId: 'someone-else' });

    const request = new NextRequest('http://localhost:3000/api/tests/test-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'test-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You do not have permission to delete this test');
    expect(mockDeleteTest).not.toHaveBeenCalled();
  });

  test('returns success when owner deletes test', async () => {
    mockSession('user-1', 'user@example.com');
    mockGetTestOwner.mockResolvedValue({ userId: 'user-1' });
    mockDeleteTest.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/tests/test-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'test-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDeleteTest).toHaveBeenCalledWith('test-1');
  });

  test('admin can delete an unowned test', async () => {
    mockSession('admin-user', process.env.ADMIN_EMAIL!);
    mockGetTestOwner.mockResolvedValue({ userId: null });
    mockDeleteTest.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/tests/test-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'test-1' } });

    expect(response.status).toBe(200);
    expect(mockDeleteTest).toHaveBeenCalledWith('test-1');
  });

  test('returns 500 on database error', async () => {
    mockSession('user-1', 'user@example.com');
    mockGetTestOwner.mockResolvedValue({ userId: 'user-1' });
    mockDeleteTest.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/tests/test-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'test-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete test from database');
  });
});
