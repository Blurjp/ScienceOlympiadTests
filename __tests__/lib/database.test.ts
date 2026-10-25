/**
 * Tests for saveTest() in lib/database.ts.
 *
 * Regression guard: deployed databases enforce a narrow CHECK constraint on
 * tests.difficulty (Easy/Medium/Hard only). Callers like the AI generator
 * pass competition levels ('Regional', 'Invitational', ...), which must be
 * mapped before persisting or the INSERT fails with SQLITE_CONSTRAINT and
 * the test silently never appears in the user's library.
 */
jest.mock('@libsql/client', () => {
  const mockClient = {
    execute: jest.fn().mockResolvedValue({ rows: [] }),
    batch: jest.fn().mockResolvedValue([]),
  };
  return { createClient: jest.fn(() => mockClient) };
});

import { createClient } from '@libsql/client';
import { saveTest } from '@/lib/database';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function getMockClient() {
  // The client is created lazily on the first saveTest() call and cached
  // module-side, so read the latest createClient() result on demand.
  const results = mockCreateClient.mock.results;
  return results[results.length - 1].value as {
    execute: jest.Mock;
    batch: jest.Mock;
  };
}

/** Run a save and return the batch statements it produced (latest call). */
async function saveAndCapture(test: any, userId?: string) {
  const { batch } = getMockClient();
  const callCountBefore = batch.mock.calls.length;
  await saveTest(test, undefined, undefined, userId);
  const calls = batch.mock.calls;
  const statements = calls[calls.length - 1][0];
  expect(calls.length).toBe(callCountBefore + 1);
  return statements as Array<{ sql: string; args: any[] }>;
}

function buildTest(difficulty: any) {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    year: 2026,
    title: 'AI Generated: Astronomy Practice Test',
    description: 'generated',
    difficulty,
    totalTime: 900,
    totalPoints: 10,
    topic: 'Astronomy',
    questions: [
      {
        id: 'q-1',
        type: 'multiple-choice' as const,
        question: 'Which planet has the tallest volcano?',
        correctAnswer: 'A) Mars',
        points: 1,
        category: 'Astronomy',
        options: ['A) Mars', 'B) Venus'],
      },
    ],
  };
}

describe('saveTest difficulty mapping', () => {
  beforeAll(async () => {
    delete process.env.TURSO_DATABASE_URL; // force the mocked local client
    // Warm up the lazily-created client so getMockClient() has a result
    await saveTest(buildTest('Medium'));
  });

  test('maps competition levels to database-compatible difficulty', async () => {
    const cases: Array<[string, string]> = [
      ['Invitational', 'Easy'],
      ['Regional', 'Medium'],
      ['State', 'Medium'],
      ['National', 'Hard'],
    ];

    for (const [level, expected] of cases) {
      const statements = await saveAndCapture(buildTest(level), 'user-1');
      // args order: id, user_id, year, title, description, difficulty, ...
      expect(statements[0].args[5]).toBe(expected);
      expect(statements[0].args[1]).toBe('user-1');
    }
  });

  test('keeps already-compatible difficulty values unchanged', async () => {
    for (const value of ['Easy', 'Medium', 'Hard']) {
      const statements = await saveAndCapture(buildTest(value));
      expect(statements[0].args[5]).toBe(value);
    }
  });

  test('persists null difficulty when absent', async () => {
    const statements = await saveAndCapture(buildTest(undefined));
    expect(statements[0].args[5]).toBeNull();
  });

  test('still writes the test, questions, and options in one batch', async () => {
    const statements = await saveAndCapture(buildTest('Regional'), 'user-1');
    // 1 test insert + 1 question-cleanup delete + 1 question + 2 options
    expect(statements).toHaveLength(5);
    expect(statements[0].sql).toContain('INSERT OR REPLACE INTO tests');
    expect(statements[1].sql).toContain('DELETE FROM questions');
    expect(statements[2].sql).toContain('INSERT INTO questions');
    expect(statements[3].sql).toContain('INSERT INTO question_options');
    expect(statements[4].sql).toContain('INSERT INTO question_options');
  });
});
