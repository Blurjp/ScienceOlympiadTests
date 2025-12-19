/**
 * Tests for app/api/tests/route.ts
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tests/route';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getAllTests: jest.fn(),
  getTestsByYear: jest.fn(),
  getTestsByTopic: jest.fn(),
  getTestsByYearAndTopic: jest.fn(),
  getAvailableYears: jest.fn(),
  getAvailableTopics: jest.fn(),
  getAvailableRegions: jest.fn(),
}));

import {
  getAllTests,
  getTestsByYear,
  getTestsByTopic,
  getTestsByYearAndTopic,
  getAvailableYears,
  getAvailableTopics,
  getAvailableRegions,
} from '@/lib/database';

const mockGetAllTests = getAllTests as jest.MockedFunction<typeof getAllTests>;
const mockGetTestsByYear = getTestsByYear as jest.MockedFunction<typeof getTestsByYear>;
const mockGetTestsByTopic = getTestsByTopic as jest.MockedFunction<typeof getTestsByTopic>;
const mockGetTestsByYearAndTopic = getTestsByYearAndTopic as jest.MockedFunction<typeof getTestsByYearAndTopic>;
const mockGetAvailableYears = getAvailableYears as jest.MockedFunction<typeof getAvailableYears>;
const mockGetAvailableTopics = getAvailableTopics as jest.MockedFunction<typeof getAvailableTopics>;
const mockGetAvailableRegions = getAvailableRegions as jest.MockedFunction<typeof getAvailableRegions>;

describe('GET /api/tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleTests = [
    {
      id: 'test-1',
      year: 2023,
      title: 'Anatomy Test',
      topic: 'Anatomy and Physiology',
      difficulty: 'Invitational',
      totalTime: 3600,
      totalPoints: 100,
    },
  ];

  describe('get all tests', () => {
    test('returns all tests when no filters', async () => {
      mockGetAllTests.mockResolvedValue(sampleTests as any);

      const request = new NextRequest('http://localhost:3000/api/tests');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tests).toEqual(sampleTests);
      expect(mockGetAllTests).toHaveBeenCalledTimes(1);
    });
  });

  describe('filter by year', () => {
    test('returns tests filtered by year', async () => {
      mockGetTestsByYear.mockResolvedValue(sampleTests as any);

      const request = new NextRequest('http://localhost:3000/api/tests?year=2023');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tests).toEqual(sampleTests);
      expect(mockGetTestsByYear).toHaveBeenCalledWith(2023);
    });
  });

  describe('filter by topic', () => {
    test('returns tests filtered by topic', async () => {
      mockGetTestsByTopic.mockResolvedValue(sampleTests as any);

      const request = new NextRequest('http://localhost:3000/api/tests?topic=Anatomy%20and%20Physiology');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tests).toEqual(sampleTests);
      expect(mockGetTestsByTopic).toHaveBeenCalledWith('Anatomy and Physiology');
    });
  });

  describe('filter by year and topic', () => {
    test('returns tests filtered by both year and topic', async () => {
      mockGetTestsByYearAndTopic.mockResolvedValue(sampleTests as any);

      const request = new NextRequest('http://localhost:3000/api/tests?year=2023&topic=Anatomy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tests).toEqual(sampleTests);
      expect(mockGetTestsByYearAndTopic).toHaveBeenCalledWith(2023, 'Anatomy');
    });
  });

  describe('action=years', () => {
    test('returns available years', async () => {
      const years = [2023, 2022, 2021];
      mockGetAvailableYears.mockResolvedValue(years);

      const request = new NextRequest('http://localhost:3000/api/tests?action=years');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.years).toEqual(years);
      expect(mockGetAvailableYears).toHaveBeenCalledTimes(1);
    });
  });

  describe('action=topics', () => {
    test('returns available topics', async () => {
      const topics = ['Anatomy and Physiology', 'Astronomy', 'Chemistry Lab'];
      mockGetAvailableTopics.mockResolvedValue(topics);

      const request = new NextRequest('http://localhost:3000/api/tests?action=topics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.topics).toEqual(topics);
      expect(mockGetAvailableTopics).toHaveBeenCalledTimes(1);
    });
  });

  describe('action=regions', () => {
    test('returns available regions', async () => {
      const regions = ['Invitational', 'Regional', 'State'];
      mockGetAvailableRegions.mockResolvedValue(regions);

      const request = new NextRequest('http://localhost:3000/api/tests?action=regions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.regions).toEqual(regions);
      expect(mockGetAvailableRegions).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    test('returns 500 on database error', async () => {
      mockGetAllTests.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/tests');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch tests from database');
    });
  });
});
