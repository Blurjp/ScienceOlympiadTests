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

jest.mock('@/lib/admin-auth', () => {
  const actual = jest.requireActual<typeof import('@/lib/admin-auth')>('@/lib/admin-auth');
  return {
    // Delegate to the real implementation by default so existing tests that
    // sign in as process.env.ADMIN_EMAIL keep working; individual tests
    // override with mockReturnValue.
    isAdminEmail: jest.fn((email?: string | null) => actual.isAdminEmail(email)),
  };
});

import { auth } from '@/auth';
import { getTest, getTestOwner, deleteTest } from '@/lib/database';
import { isAdminEmail } from '@/lib/admin-auth';

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<any>>;
const mockGetTest = getTest as jest.MockedFunction<typeof getTest>;
const mockGetTestOwner = getTestOwner as jest.MockedFunction<typeof getTestOwner>;
const mockDeleteTest = deleteTest as jest.MockedFunction<typeof deleteTest>;
const mockIsAdminEmail = isAdminEmail as jest.MockedFunction<typeof isAdminEmail>;

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

  describe('private test visibility', () => {
    const privateTest = {
      ...sampleTest,
      userId: 'user-1',
      isPublic: false,
    };

    beforeEach(() => {
      // Default to non-admin; jest.clearAllMocks() clears calls but NOT
      // implementations, so an implementation from an earlier test would
      // otherwise leak into these.
      mockIsAdminEmail.mockReturnValue(false);
    });

    afterEach(() => {
      // Restore the real (delegating) implementation so later describes -
      // e.g. the DELETE admin test using process.env.ADMIN_EMAIL - aren't
      // affected by this describe's overrides.
      mockIsAdminEmail.mockReset();
      mockIsAdminEmail.mockImplementation((email?: string | null) =>
        (jest.requireActual('@/lib/admin-auth') as typeof import('@/lib/admin-auth')).isAdminEmail(email)
      );
    });

    test('returns 404 to anonymous viewers, identical to a missing id', async () => {
      mockAuth.mockResolvedValue(null as any);
      mockGetTest.mockResolvedValue(privateTest as any);

      const request = new NextRequest('http://localhost:3000/api/tests/test-1');
      const response = await GET(request, { params: { id: 'test-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Test not found');
    });

    test('returns 404 to signed-in non-owners', async () => {
      mockSession('someone-else', 'other@example.com');
      mockGetTest.mockResolvedValue(privateTest as any);

      const request = new NextRequest('http://localhost:3000/api/tests/test-1');
      const response = await GET(request, { params: { id: 'test-1' } });

      expect(response.status).toBe(404);
    });

    test('returns the test to its owner', async () => {
      mockSession('user-1', 'user@example.com');
      mockGetTest.mockResolvedValue(privateTest as any);

      const request = new NextRequest('http://localhost:3000/api/tests/test-1');
      const response = await GET(request, { params: { id: 'test-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.test.id).toBe('test-1');
      // Viewer-dependent response must never be stored in a shared cache
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });

    test('returns the test to an admin', async () => {
      mockSession('admin-1', 'admin@example.com');
      mockIsAdminEmail.mockReturnValue(true);
      mockGetTest.mockResolvedValue(privateTest as any);

      const request = new NextRequest('http://localhost:3000/api/tests/test-1');
      const response = await GET(request, { params: { id: 'test-1' } });

      expect(response.status).toBe(200);
    });

    test('public tests remain readable by anonymous viewers with no-store', async () => {
      mockAuth.mockResolvedValue(null as any);
      mockGetTest.mockResolvedValue({ ...sampleTest, isPublic: true } as any);

      const request = new NextRequest('http://localhost:3000/api/tests/test-1');
      const response = await GET(request, { params: { id: 'test-1' } });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
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
