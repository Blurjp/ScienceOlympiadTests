/**
 * Tests for app/api/tests/[id]/route.ts
 */
import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/tests/[id]/route';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getTest: jest.fn(),
  deleteTest: jest.fn(),
}));

import { getTest, deleteTest } from '@/lib/database';

const mockGetTest = getTest as jest.MockedFunction<typeof getTest>;
const mockDeleteTest = deleteTest as jest.MockedFunction<typeof deleteTest>;

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

  test('returns success when test deleted', async () => {
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

  test('returns 500 on database error', async () => {
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
