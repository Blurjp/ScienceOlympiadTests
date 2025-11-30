import { createClient, Client } from '@libsql/client';
import { Test, Question } from './types';

let db: Client | null = null;

export function getDatabase(): Client {
  if (!db) {
    // Use Turso in production, local file in development
    if (process.env.TURSO_DATABASE_URL) {
      db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      // Local SQLite file for development
      db = createClient({
        url: 'file:scioly.db',
      });
    }
    // Initialize database tables
    initializeDatabase();
  }
  return db;
}

async function initializeDatabase() {
  const database = getDatabase();

  // Create users table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      provider TEXT,
      provider_account_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tests table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      year INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
      total_time INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      topic TEXT NOT NULL,
      source_url TEXT,
      pdf_path TEXT,
      is_public BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create questions table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('multiple-choice', 'short-answer', 'diagram', 'calculation')),
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      points INTEGER NOT NULL,
      category TEXT NOT NULL,
      question_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    )
  `);

  // Create question_options table for multiple choice
  await database.execute(`
    CREATE TABLE IF NOT EXISTS question_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      option_text TEXT NOT NULL,
      option_order INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  // Create test_results table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      user_id TEXT,
      score INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      percentage REAL NOT NULL,
      correct_answers INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      time_spent INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create indexes
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_tests_year ON tests(year)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_tests_topic ON tests(topic)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_tests_difficulty ON tests(difficulty)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id)`);
}

// Ensure database is initialized
let initPromise: Promise<void> | null = null;
export async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  await initPromise;
}

// Test operations
export async function saveTest(test: Test, sourceUrl?: string, pdfPath?: string) {
  await ensureInitialized();
  const database = getDatabase();

  await database.execute({
    sql: `INSERT OR REPLACE INTO tests
      (id, year, title, description, difficulty, total_time, total_points, topic, source_url, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      test.id,
      test.year,
      test.title,
      test.description,
      test.difficulty,
      test.totalTime,
      test.totalPoints,
      test.topic,
      sourceUrl || null,
      pdfPath || null
    ]
  });

  // Delete existing questions for this test
  await database.execute({
    sql: 'DELETE FROM questions WHERE test_id = ?',
    args: [test.id]
  });

  // Insert questions
  for (let index = 0; index < test.questions.length; index++) {
    const question = test.questions[index];
    await database.execute({
      sql: `INSERT INTO questions
        (id, test_id, type, question, correct_answer, points, category, question_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        question.id,
        test.id,
        question.type,
        question.question,
        question.correctAnswer,
        question.points,
        question.category,
        index
      ]
    });

    if (question.options) {
      for (let optIndex = 0; optIndex < question.options.length; optIndex++) {
        await database.execute({
          sql: `INSERT INTO question_options (question_id, option_text, option_order) VALUES (?, ?, ?)`,
          args: [question.id, question.options[optIndex], optIndex]
        });
      }
    }
  }
}

export async function getTest(testId: string): Promise<Test | null> {
  await ensureInitialized();
  const database = getDatabase();

  const testResult = await database.execute({
    sql: 'SELECT * FROM tests WHERE id = ?',
    args: [testId]
  });

  if (testResult.rows.length === 0) return null;
  const test = testResult.rows[0] as any;

  const questionsResult = await database.execute({
    sql: 'SELECT * FROM questions WHERE test_id = ? ORDER BY question_order',
    args: [testId]
  });

  const questionWithOptions: Question[] = await Promise.all(
    questionsResult.rows.map(async (q: any) => {
      const optionsResult = await database.execute({
        sql: 'SELECT option_text FROM question_options WHERE question_id = ? ORDER BY option_order',
        args: [q.id]
      });

      return {
        id: q.id,
        type: q.type,
        question: q.question,
        correctAnswer: q.correct_answer,
        points: q.points,
        category: q.category,
        options: optionsResult.rows.length > 0
          ? optionsResult.rows.map((o: any) => o.option_text)
          : undefined,
      };
    })
  );

  return {
    id: test.id,
    year: test.year,
    title: test.title,
    description: test.description,
    difficulty: test.difficulty,
    totalTime: test.total_time,
    totalPoints: test.total_points,
    topic: test.topic,
    questions: questionWithOptions,
  };
}

export async function getAllTests(): Promise<Test[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute('SELECT id FROM tests ORDER BY year DESC, title');
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function getTestsByYear(year: number): Promise<Test[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute({
    sql: 'SELECT id FROM tests WHERE year = ? ORDER BY title',
    args: [year]
  });
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function getTestsByTopic(topic: string): Promise<Test[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute({
    sql: 'SELECT id FROM tests WHERE topic = ? ORDER BY year DESC, title',
    args: [topic]
  });
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function getTestsByYearAndTopic(year: number, topic: string): Promise<Test[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute({
    sql: 'SELECT id FROM tests WHERE year = ? AND topic = ? ORDER BY title',
    args: [year, topic]
  });
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function searchQuestions(filters: {
  topic?: string;
  category?: string;
  type?: string;
  difficulty?: string;
}): Promise<Question[]> {
  await ensureInitialized();
  const database = getDatabase();

  let query = `
    SELECT DISTINCT q.* FROM questions q
    JOIN tests t ON q.test_id = t.id
    WHERE 1=1
  `;
  const args: any[] = [];

  if (filters.topic) {
    query += ' AND t.topic = ?';
    args.push(filters.topic);
  }

  if (filters.category) {
    query += ' AND q.category = ?';
    args.push(filters.category);
  }

  if (filters.type) {
    query += ' AND q.type = ?';
    args.push(filters.type);
  }

  if (filters.difficulty) {
    query += ' AND t.difficulty = ?';
    args.push(filters.difficulty);
  }

  const result = await database.execute({ sql: query, args });

  return Promise.all(result.rows.map(async (q: any) => {
    const optionsResult = await database.execute({
      sql: 'SELECT option_text FROM question_options WHERE question_id = ? ORDER BY option_order',
      args: [q.id]
    });

    return {
      id: q.id,
      type: q.type,
      question: q.question,
      correctAnswer: q.correct_answer,
      points: q.points,
      category: q.category,
      options: optionsResult.rows.length > 0
        ? optionsResult.rows.map((o: any) => o.option_text)
        : undefined,
    };
  }));
}

export async function getAvailableYears(): Promise<number[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute('SELECT DISTINCT year FROM tests ORDER BY year DESC');
  return result.rows.map((y: any) => y.year);
}

export async function getAvailableTopics(): Promise<string[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute('SELECT DISTINCT topic FROM tests ORDER BY topic');
  return result.rows.map((t: any) => t.topic);
}

export async function deleteTest(testId: string) {
  await ensureInitialized();
  const database = getDatabase();
  await database.execute({
    sql: 'DELETE FROM tests WHERE id = ?',
    args: [testId]
  });
}

// User operations
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider?: string;
  providerAccountId?: string;
}

export async function createUser(user: User) {
  await ensureInitialized();
  const database = getDatabase();
  await database.execute({
    sql: `INSERT OR REPLACE INTO users
      (id, email, name, image, provider, provider_account_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      user.id,
      user.email,
      user.name || null,
      user.image || null,
      user.provider || null,
      user.providerAccountId || null
    ]
  });
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email]
  });

  if (result.rows.length === 0) return null;
  const user = result.rows[0] as any;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    provider: user.provider,
    providerAccountId: user.provider_account_id,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id]
  });

  if (result.rows.length === 0) return null;
  const user = result.rows[0] as any;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    provider: user.provider,
    providerAccountId: user.provider_account_id,
  };
}

export async function updateUser(userId: string, updates: Partial<User>) {
  await ensureInitialized();
  const database = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.image !== undefined) {
    fields.push('image = ?');
    values.push(updates.image);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await database.execute({ sql: query, args: values });
}

// Test results operations
export interface TestResultData {
  id: string;
  testId: string;
  userId?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
}

export async function saveTestResult(result: TestResultData) {
  await ensureInitialized();
  const database = getDatabase();
  await database.execute({
    sql: `INSERT INTO test_results
      (id, test_id, user_id, score, total_points, percentage, correct_answers, total_questions, time_spent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      result.id,
      result.testId,
      result.userId || null,
      result.score,
      result.totalPoints,
      result.percentage,
      result.correctAnswers,
      result.totalQuestions,
      result.timeSpent
    ]
  });
  return result;
}

export async function getUserStats(userId: string): Promise<{
  testsCompleted: number;
  averageScore: number;
  testsCreated: number;
}> {
  await ensureInitialized();
  const database = getDatabase();

  const resultsStats = await database.execute({
    sql: `SELECT COUNT(*) as count, AVG(percentage) as avg_score
      FROM test_results WHERE user_id = ?`,
    args: [userId]
  });

  const testsCreated = await database.execute({
    sql: `SELECT COUNT(*) as count FROM tests WHERE user_id = ?`,
    args: [userId]
  });

  const stats = resultsStats.rows[0] as any;
  const created = testsCreated.rows[0] as any;

  return {
    testsCompleted: stats?.count || 0,
    averageScore: Math.round(stats?.avg_score || 0),
    testsCreated: created?.count || 0,
  };
}

export async function getUserTestResults(userId: string): Promise<TestResultData[]> {
  await ensureInitialized();
  const database = getDatabase();
  const result = await database.execute({
    sql: `SELECT * FROM test_results WHERE user_id = ? ORDER BY completed_at DESC`,
    args: [userId]
  });

  return result.rows.map((r: any) => ({
    id: r.id,
    testId: r.test_id,
    userId: r.user_id,
    score: r.score,
    totalPoints: r.total_points,
    percentage: r.percentage,
    correctAnswers: r.correct_answers,
    totalQuestions: r.total_questions,
    timeSpent: r.time_spent,
  }));
}
