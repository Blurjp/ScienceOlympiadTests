import { createClient, Client } from '@libsql/client';
import { Test, Question } from './types';

let db: Client | null = null;
let initialized = false;

function getClient(): Client {
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
  }
  return db;
}

async function initializeDatabase() {
  if (initialized) return;

  const database = getClient();

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
      difficulty TEXT CHECK(difficulty IN ('Invitational', 'Regional', 'State', 'National', 'Easy', 'Medium', 'Hard')),
      total_time INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      topic TEXT NOT NULL,
      region TEXT CHECK(region IN ('Invitational', 'Regionals', 'States', 'Nationals')),
      source_url TEXT,
      pdf_path TEXT,
      is_public BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Add region column if it doesn't exist (for existing databases)
  try {
    await database.execute(`ALTER TABLE tests ADD COLUMN region TEXT CHECK(region IN ('Invitational', 'Regionals', 'States', 'Nationals'))`);
  } catch (e) {
    // Column already exists, ignore
  }

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

  initialized = true;
}

// Get database with initialization
async function getDatabase(): Promise<Client> {
  await initializeDatabase();
  return getClient();
}

// Test operations
export async function saveTest(test: Test, sourceUrl?: string, pdfPath?: string) {
  const database = await getDatabase();

  await database.execute({
    sql: `INSERT OR REPLACE INTO tests
      (id, year, title, description, difficulty, total_time, total_points, topic, region, source_url, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      test.id,
      test.year,
      test.title,
      test.description,
      test.difficulty,
      test.totalTime,
      test.totalPoints,
      test.topic,
      test.region || null,
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
  const database = await getDatabase();

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
    region: test.region || undefined,
    questions: questionWithOptions,
  };
}

export async function getAllTests(): Promise<Test[]> {
  const database = await getDatabase();
  const result = await database.execute('SELECT id FROM tests ORDER BY year DESC, title');
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function getTestsByYear(year: number): Promise<Test[]> {
  const database = await getDatabase();
  const result = await database.execute({
    sql: 'SELECT id FROM tests WHERE year = ? ORDER BY title',
    args: [year]
  });
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function getTestsByTopic(topic: string): Promise<Test[]> {
  const database = await getDatabase();
  const result = await database.execute({
    sql: 'SELECT id FROM tests WHERE topic = ? ORDER BY year DESC, title',
    args: [topic]
  });
  const tests = await Promise.all(result.rows.map((t: any) => getTest(t.id)));
  return tests.filter((t): t is Test => t !== null);
}

export async function getTestsByYearAndTopic(year: number, topic: string): Promise<Test[]> {
  const database = await getDatabase();
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
  year?: number;
  region?: string;
}): Promise<Question[]> {
  const database = await getDatabase();

  let query = `
    SELECT DISTINCT q.*, t.year as test_year, t.region as test_region FROM questions q
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

  if (filters.year) {
    query += ' AND t.year = ?';
    args.push(filters.year);
  }

  if (filters.region) {
    query += ' AND t.region = ?';
    args.push(filters.region);
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
  const database = await getDatabase();
  const result = await database.execute('SELECT DISTINCT year FROM tests ORDER BY year DESC');
  return result.rows.map((y: any) => y.year);
}

export async function getAvailableTopics(): Promise<string[]> {
  const database = await getDatabase();
  const result = await database.execute('SELECT DISTINCT topic FROM tests ORDER BY topic');
  return result.rows.map((t: any) => t.topic);
}

export async function getAvailableRegions(): Promise<string[]> {
  const database = await getDatabase();
  const result = await database.execute('SELECT DISTINCT region FROM tests WHERE region IS NOT NULL ORDER BY region');
  return result.rows.map((r: any) => r.region);
}

export async function deleteTest(testId: string) {
  const database = await getDatabase();
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
  const database = await getDatabase();
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
  const database = await getDatabase();
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
  const database = await getDatabase();
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
  const database = await getDatabase();
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
  completedAt?: string;
}

export async function saveTestResult(result: TestResultData) {
  const database = await getDatabase();
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
  const database = await getDatabase();

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
  const database = await getDatabase();
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
    completedAt: r.completed_at,
  }));
}

// Analytics tables initialization
async function initializeAnalyticsTables() {
  const database = getClient();

  // API usage tracking table (for LLM token usage)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      endpoint TEXT NOT NULL,
      model TEXT,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      cost_usd REAL DEFAULT 0,
      topic TEXT,
      difficulty TEXT,
      question_count INTEGER,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for analytics queries
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint)`);
}

// Call analytics init after main init
const originalInitializeDatabase = initializeDatabase;
async function initializeDatabaseWithAnalytics() {
  await originalInitializeDatabase();
  await initializeAnalyticsTables();
}

// API Usage tracking
export interface ApiUsageData {
  userId?: string;
  endpoint: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  success?: boolean;
  errorMessage?: string;
}

export async function logApiUsage(usage: ApiUsageData) {
  const database = await getDatabase();
  await initializeAnalyticsTables();

  await database.execute({
    sql: `INSERT INTO api_usage
      (user_id, endpoint, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, topic, difficulty, question_count, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      usage.userId || null,
      usage.endpoint,
      usage.model || null,
      usage.promptTokens || 0,
      usage.completionTokens || 0,
      usage.totalTokens || 0,
      usage.costUsd || 0,
      usage.topic || null,
      usage.difficulty || null,
      usage.questionCount || null,
      usage.success !== false ? 1 : 0,
      usage.errorMessage || null
    ]
  });
}

// Admin analytics functions
export async function getAdminStats(): Promise<{
  totalUsers: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  totalTests: number;
  testsGenerated: number;
  testsCompleted: number;
  totalTokensUsed: number;
  totalCost: number;
  apiCallsToday: number;
}> {
  const database = await getDatabase();
  await initializeAnalyticsTables();

  // User counts
  const totalUsers = await database.execute('SELECT COUNT(*) as count FROM users');
  const usersToday = await database.execute(
    "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-1 day')"
  );
  const usersThisWeek = await database.execute(
    "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')"
  );
  const usersThisMonth = await database.execute(
    "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-30 days')"
  );

  // Test counts
  const totalTests = await database.execute('SELECT COUNT(*) as count FROM tests');
  const testsCompleted = await database.execute('SELECT COUNT(*) as count FROM test_results');

  // API usage stats
  const tokenStats = await database.execute(
    'SELECT SUM(total_tokens) as tokens, SUM(cost_usd) as cost FROM api_usage'
  );
  const testsGenerated = await database.execute(
    "SELECT COUNT(*) as count FROM api_usage WHERE endpoint = 'generate-ai-test' AND success = 1"
  );
  const apiCallsToday = await database.execute(
    "SELECT COUNT(*) as count FROM api_usage WHERE created_at >= datetime('now', '-1 day')"
  );

  return {
    totalUsers: (totalUsers.rows[0] as any)?.count || 0,
    usersToday: (usersToday.rows[0] as any)?.count || 0,
    usersThisWeek: (usersThisWeek.rows[0] as any)?.count || 0,
    usersThisMonth: (usersThisMonth.rows[0] as any)?.count || 0,
    totalTests: (totalTests.rows[0] as any)?.count || 0,
    testsGenerated: (testsGenerated.rows[0] as any)?.count || 0,
    testsCompleted: (testsCompleted.rows[0] as any)?.count || 0,
    totalTokensUsed: (tokenStats.rows[0] as any)?.tokens || 0,
    totalCost: (tokenStats.rows[0] as any)?.cost || 0,
    apiCallsToday: (apiCallsToday.rows[0] as any)?.count || 0,
  };
}

export async function getApiUsageByDay(days: number = 30): Promise<{
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}[]> {
  const database = await getDatabase();
  await initializeAnalyticsTables();

  const result = await database.execute({
    sql: `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as calls,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM api_usage
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
    args: [days]
  });

  return result.rows.map((r: any) => ({
    date: r.date,
    calls: r.calls || 0,
    tokens: r.tokens || 0,
    cost: r.cost || 0,
  }));
}

export async function getTopicUsageStats(): Promise<{
  topic: string;
  count: number;
  tokens: number;
}[]> {
  const database = await getDatabase();
  await initializeAnalyticsTables();

  const result = await database.execute(`
    SELECT
      topic,
      COUNT(*) as count,
      SUM(total_tokens) as tokens
    FROM api_usage
    WHERE topic IS NOT NULL AND success = 1
    GROUP BY topic
    ORDER BY count DESC
  `);

  return result.rows.map((r: any) => ({
    topic: r.topic,
    count: r.count || 0,
    tokens: r.tokens || 0,
  }));
}

export async function getRecentUsers(limit: number = 20): Promise<{
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}[]> {
  const database = await getDatabase();

  const result = await database.execute({
    sql: 'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT ?',
    args: [limit]
  });

  return result.rows.map((r: any) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    createdAt: r.created_at,
  }));
}

export async function getRecentApiCalls(limit: number = 50): Promise<{
  id: number;
  endpoint: string;
  model: string | null;
  totalTokens: number;
  costUsd: number;
  topic: string | null;
  difficulty: string | null;
  success: boolean;
  createdAt: string;
}[]> {
  const database = await getDatabase();
  await initializeAnalyticsTables();

  const result = await database.execute({
    sql: 'SELECT * FROM api_usage ORDER BY created_at DESC LIMIT ?',
    args: [limit]
  });

  return result.rows.map((r: any) => ({
    id: r.id,
    endpoint: r.endpoint,
    model: r.model,
    totalTokens: r.total_tokens || 0,
    costUsd: r.cost_usd || 0,
    topic: r.topic,
    difficulty: r.difficulty,
    success: r.success === 1,
    createdAt: r.created_at,
  }));
}
