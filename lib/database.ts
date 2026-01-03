import { createClient, Client } from '@libsql/client';
import { Test, Question } from './types';
import { normalizeTopic } from './topic-utils';

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

  // Add subscription columns to users table if they don't exist
  try {
    await database.execute(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await database.execute(`ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free'`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await database.execute(`ALTER TABLE users ADD COLUMN subscription_id TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await database.execute(`ALTER TABLE users ADD COLUMN subscription_current_period_end DATETIME`);
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

// Subscription status types
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due';

// User operations
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider?: string;
  providerAccountId?: string;
  stripeCustomerId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionId?: string;
  subscriptionCurrentPeriodEnd?: string;
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
    stripeCustomerId: user.stripe_customer_id,
    subscriptionStatus: user.subscription_status || 'free',
    subscriptionId: user.subscription_id,
    subscriptionCurrentPeriodEnd: user.subscription_current_period_end,
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
    stripeCustomerId: user.stripe_customer_id,
    subscriptionStatus: user.subscription_status || 'free',
    subscriptionId: user.subscription_id,
    subscriptionCurrentPeriodEnd: user.subscription_current_period_end,
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

// Subscription operations
export interface SubscriptionData {
  stripeCustomerId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionId?: string;
  subscriptionCurrentPeriodEnd?: string;
}

export async function updateUserSubscription(userId: string, data: SubscriptionData) {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.stripeCustomerId !== undefined) {
    fields.push('stripe_customer_id = ?');
    values.push(data.stripeCustomerId);
  }
  if (data.subscriptionStatus !== undefined) {
    fields.push('subscription_status = ?');
    values.push(data.subscriptionStatus);
  }
  if (data.subscriptionId !== undefined) {
    fields.push('subscription_id = ?');
    values.push(data.subscriptionId);
  }
  if (data.subscriptionCurrentPeriodEnd !== undefined) {
    fields.push('subscription_current_period_end = ?');
    values.push(data.subscriptionCurrentPeriodEnd);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await database.execute({ sql: query, args: values });
}

export async function getUserByStripeCustomerId(customerId: string): Promise<User | null> {
  const database = await getDatabase();
  const result = await database.execute({
    sql: 'SELECT * FROM users WHERE stripe_customer_id = ?',
    args: [customerId]
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
    stripeCustomerId: user.stripe_customer_id,
    subscriptionStatus: user.subscription_status || 'free',
    subscriptionId: user.subscription_id,
    subscriptionCurrentPeriodEnd: user.subscription_current_period_end,
  };
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const database = await getDatabase();
  const result = await database.execute({
    sql: 'SELECT subscription_status FROM users WHERE id = ?',
    args: [userId]
  });

  if (result.rows.length === 0) return 'free';
  const user = result.rows[0] as any;
  return (user.subscription_status as SubscriptionStatus) || 'free';
}

export async function getUserMonthlyAIGenerations(userId: string): Promise<number> {
  const database = await getDatabase();
  await initializeAnalyticsTables();

  // Count successful AI test generations for this user in the current calendar month
  const result = await database.execute({
    sql: `SELECT COUNT(*) as count FROM api_usage
          WHERE user_id = ?
          AND endpoint = 'generate-ai-test'
          AND success = 1
          AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
    args: [userId]
  });

  return (result.rows[0] as any)?.count || 0;
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

// Generation cache table - caches generated test templates to avoid repeated LLM calls
async function initializeGenerationCacheTable() {
  const database = getClient();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS generation_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      source_id TEXT NOT NULL,
      source_url TEXT,
      question_count INTEGER NOT NULL,
      generated_questions TEXT NOT NULL,
      meta_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      use_count INTEGER DEFAULT 1
    )
  `);

  await database.execute(`CREATE INDEX IF NOT EXISTS idx_generation_cache_key ON generation_cache(cache_key)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_generation_cache_source ON generation_cache(source_id)`);
}

// Generation cache operations
export interface CachedGeneration {
  id: number;
  cacheKey: string;
  sourceId: string;
  sourceUrl?: string;
  questionCount: number;
  generatedQuestions: string; // JSON string of questions
  metaInfo?: string; // JSON string of meta info
  createdAt: string;
  lastUsedAt: string;
  useCount: number;
}

// Cache version - increment this when making quality improvements to prompts/validation
// This ensures old cached generations are ignored after improvements
export const GENERATION_CACHE_VERSION = 7; // v7: Fix double option prefixes (A. a. Nitrogen), division filtering

// Generate a cache key based on source and parameters
export function generateCacheKey(sourceId: string, questionCount: number): string {
  // Using a simple key format: version + sourceId + questionCount + bucket
  // Bucket allows multiple cached versions for same config
  const bucket = Math.floor(Math.random() * 5); // 5 different cached versions
  return `gen_v${GENERATION_CACHE_VERSION}_${sourceId}_${questionCount}_b${bucket}`;
}

// Get a cached generation if available
export async function getCachedGeneration(sourceId: string, questionCount: number): Promise<CachedGeneration | null> {
  const database = await getDatabase();
  await initializeGenerationCacheTable();

  // Try to find a cached version with matching source, question count, AND current version
  // The cache_key starts with "gen_v{VERSION}_" so we filter by prefix to ignore old versions
  const versionPrefix = `gen_v${GENERATION_CACHE_VERSION}_${sourceId}_${questionCount}_%`;
  const result = await database.execute({
    sql: `SELECT * FROM generation_cache
          WHERE source_id = ? AND question_count = ? AND cache_key LIKE ?
          ORDER BY last_used_at ASC
          LIMIT 1`,
    args: [sourceId, questionCount, versionPrefix]
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;

  // Update last_used_at and use_count
  await database.execute({
    sql: `UPDATE generation_cache
          SET last_used_at = CURRENT_TIMESTAMP, use_count = use_count + 1
          WHERE id = ?`,
    args: [row.id]
  });

  return {
    id: row.id,
    cacheKey: row.cache_key,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    questionCount: row.question_count,
    generatedQuestions: row.generated_questions,
    metaInfo: row.meta_info,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    useCount: row.use_count,
  };
}

// Save a generation to cache
export async function saveCachedGeneration(
  sourceId: string,
  sourceUrl: string | undefined,
  questionCount: number,
  generatedQuestions: any[],
  metaInfo?: any
): Promise<void> {
  const database = await getDatabase();
  await initializeGenerationCacheTable();

  const cacheKey = generateCacheKey(sourceId, questionCount);

  try {
    await database.execute({
      sql: `INSERT INTO generation_cache
            (cache_key, source_id, source_url, question_count, generated_questions, meta_info)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        cacheKey,
        sourceId,
        sourceUrl || null,
        questionCount,
        JSON.stringify(generatedQuestions),
        metaInfo ? JSON.stringify(metaInfo) : null
      ]
    });
  } catch (e: any) {
    // Ignore unique constraint violations (key already exists)
    if (!e.message?.includes('UNIQUE constraint')) {
      throw e;
    }
  }
}

// Get cache stats for admin
export async function getGenerationCacheStats(): Promise<{
  totalCached: number;
  totalUses: number;
  bySource: { sourceId: string; count: number; uses: number }[];
}> {
  const database = await getDatabase();
  await initializeGenerationCacheTable();

  const totalResult = await database.execute(
    'SELECT COUNT(*) as count, SUM(use_count) as uses FROM generation_cache'
  );

  const bySourceResult = await database.execute(`
    SELECT source_id, COUNT(*) as count, SUM(use_count) as uses
    FROM generation_cache
    GROUP BY source_id
    ORDER BY uses DESC
  `);

  const total = totalResult.rows[0] as any;
  return {
    totalCached: total?.count || 0,
    totalUses: total?.uses || 0,
    bySource: bySourceResult.rows.map((r: any) => ({
      sourceId: r.source_id,
      count: r.count || 0,
      uses: r.uses || 0,
    })),
  };
}

// Clear old cache entries (keep only recent ones per source)
export async function cleanupGenerationCache(maxPerSource: number = 10): Promise<number> {
  const database = await getDatabase();
  await initializeGenerationCacheTable();

  // Delete entries beyond maxPerSource for each source, keeping most recently used
  const result = await database.execute({
    sql: `DELETE FROM generation_cache
          WHERE id NOT IN (
            SELECT id FROM (
              SELECT id, ROW_NUMBER() OVER (PARTITION BY source_id ORDER BY last_used_at DESC) as rn
              FROM generation_cache
            ) WHERE rn <= ?
          )`,
    args: [maxPerSource]
  });

  return result.rowsAffected;
}

// PDF Parse Cache - caches LLM-parsed questions from PDF URLs
async function initializePdfParseCacheTable() {
  const database = getClient();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS pdf_parse_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url_hash TEXT UNIQUE NOT NULL,
      source_url TEXT NOT NULL,
      parsed_questions TEXT NOT NULL,
      metadata TEXT,
      page_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      use_count INTEGER DEFAULT 1
    )
  `);

  await database.execute(`CREATE INDEX IF NOT EXISTS idx_pdf_parse_cache_hash ON pdf_parse_cache(url_hash)`);
}

// Simple hash function for URL
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Get cached PDF parse result
export async function getCachedPdfParse(url: string): Promise<{
  questions: any[];
  metadata: any;
  pageCount: number;
} | null> {
  const database = await getDatabase();
  await initializePdfParseCacheTable();

  const urlHash = hashUrl(url);
  const result = await database.execute({
    sql: `SELECT * FROM pdf_parse_cache WHERE url_hash = ?`,
    args: [urlHash]
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;

  // Update usage stats
  await database.execute({
    sql: `UPDATE pdf_parse_cache SET last_used_at = CURRENT_TIMESTAMP, use_count = use_count + 1 WHERE id = ?`,
    args: [row.id]
  });

  return {
    questions: JSON.parse(row.parsed_questions),
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    pageCount: row.page_count || 0,
  };
}

// Save parsed PDF to cache
export async function savePdfParseCache(
  url: string,
  questions: any[],
  metadata?: any,
  pageCount?: number
): Promise<void> {
  const database = await getDatabase();
  await initializePdfParseCacheTable();

  const urlHash = hashUrl(url);

  try {
    await database.execute({
      sql: `INSERT OR REPLACE INTO pdf_parse_cache
            (url_hash, source_url, parsed_questions, metadata, page_count)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        urlHash,
        url,
        JSON.stringify(questions),
        metadata ? JSON.stringify(metadata) : null,
        pageCount || 0
      ]
    });
  } catch (e: any) {
    console.error('Failed to save PDF parse cache:', e);
  }
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

// ============================================
// Reference Questions Database (Historical Tests)
// ============================================

// Initialize reference questions table
async function initializeReferenceQuestionsTable() {
  const database = getClient();

  // Table to store curated reference questions from historical tests
  await database.execute(`
    CREATE TABLE IF NOT EXISTS reference_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      subtopic TEXT,
      division TEXT CHECK(division IN ('B', 'C')) DEFAULT 'C',
      difficulty TEXT CHECK(difficulty IN ('Invitational', 'Regional', 'State', 'National')),
      question_type TEXT CHECK(question_type IN ('multiple-choice', 'short-answer', 'calculation', 'diagram')),
      question_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      options TEXT,
      explanation TEXT,
      source_year INTEGER,
      source_tournament TEXT,
      source_url TEXT,
      tags TEXT,
      quality_score INTEGER DEFAULT 5,
      use_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(topic, question_text)
    )
  `);

  // Add division column if it doesn't exist (migration for existing tables)
  try {
    await database.execute(`ALTER TABLE reference_questions ADD COLUMN division TEXT CHECK(division IN ('B', 'C')) DEFAULT 'C'`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Create indexes for fast lookup
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_ref_questions_topic ON reference_questions(topic)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_ref_questions_difficulty ON reference_questions(difficulty)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_ref_questions_type ON reference_questions(question_type)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_ref_questions_quality ON reference_questions(quality_score DESC)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_ref_questions_division ON reference_questions(division)`);
}

// Initialize scraped tests table (metadata for tests found but not yet parsed)
async function initializeScrapedTestsTable() {
  const database = getClient();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS scraped_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      year INTEGER,
      tournament TEXT,
      division TEXT,
      test_type TEXT CHECK(test_type IN ('test', 'key', 'answer_sheet', 'unknown')),
      url TEXT NOT NULL UNIQUE,
      title TEXT,
      parsed BOOLEAN DEFAULT 0,
      parsed_at DATETIME,
      question_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.execute(`CREATE INDEX IF NOT EXISTS idx_scraped_tests_topic ON scraped_tests(topic)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_scraped_tests_parsed ON scraped_tests(parsed)`);
}

// Scraped Test interface
export interface ScrapedTest {
  id?: number;
  topic: string;
  year?: number;
  tournament?: string;
  division?: string;
  testType: 'test' | 'key' | 'answer_sheet' | 'unknown';
  url: string;
  title?: string;
  parsed?: boolean;
  parsedAt?: string;
  questionCount?: number;
}

// Save a scraped test entry
export async function saveScrapedTest(test: ScrapedTest): Promise<number> {
  const database = await getDatabase();
  await initializeScrapedTestsTable();

  const normalizedTopic = normalizeTopic(test.topic);

  const result = await database.execute({
    sql: `INSERT OR IGNORE INTO scraped_tests
      (topic, year, tournament, division, test_type, url, title)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      normalizedTopic,
      test.year || null,
      test.tournament || null,
      test.division || null,
      test.testType,
      test.url,
      test.title || null,
    ]
  });

  return Number(result.lastInsertRowid);
}

// Save multiple scraped tests in batch
export async function saveScrapedTestsBatch(tests: ScrapedTest[]): Promise<{ inserted: number; skipped: number }> {
  const database = await getDatabase();
  await initializeScrapedTestsTable();

  let inserted = 0;
  let skipped = 0;

  for (const test of tests) {
    try {
      const result = await saveScrapedTest(test);
      if (result > 0) {
        inserted++;
      } else {
        skipped++; // Already exists (IGNORE)
      }
    } catch (e) {
      console.error('Failed to save scraped test:', e);
      skipped++;
    }
  }

  return { inserted, skipped };
}

// Get scraped tests that haven't been parsed yet
export async function getUnparsedScrapedTests(limit: number = 10): Promise<ScrapedTest[]> {
  const database = await getDatabase();
  await initializeScrapedTestsTable();

  const result = await database.execute({
    sql: `SELECT * FROM scraped_tests WHERE parsed = 0 ORDER BY created_at DESC LIMIT ?`,
    args: [limit]
  });

  return result.rows.map((r: any) => ({
    id: r.id,
    topic: r.topic,
    year: r.year,
    tournament: r.tournament,
    division: r.division,
    testType: r.test_type,
    url: r.url,
    title: r.title,
    parsed: Boolean(r.parsed),
    parsedAt: r.parsed_at,
    questionCount: r.question_count,
  }));
}

// Get scraped test stats
export async function getScrapedTestStats(): Promise<{
  total: number;
  parsed: number;
  unparsed: number;
  byTopic: { topic: string; count: number }[];
}> {
  const database = await getDatabase();
  await initializeScrapedTestsTable();

  const total = await database.execute('SELECT COUNT(*) as count FROM scraped_tests');
  const parsed = await database.execute('SELECT COUNT(*) as count FROM scraped_tests WHERE parsed = 1');
  const byTopic = await database.execute(
    'SELECT topic, COUNT(*) as count FROM scraped_tests GROUP BY topic ORDER BY count DESC'
  );

  const totalCount = (total.rows[0] as any)?.count || 0;
  const parsedCount = (parsed.rows[0] as any)?.count || 0;

  return {
    total: totalCount,
    parsed: parsedCount,
    unparsed: totalCount - parsedCount,
    byTopic: byTopic.rows.map((r: any) => ({ topic: r.topic, count: r.count })),
  };
}

// Mark a scraped test as parsed
export async function markScrapedTestAsParsed(id: number, questionCount: number): Promise<void> {
  const database = await getDatabase();
  await database.execute({
    sql: `UPDATE scraped_tests SET parsed = 1, parsed_at = CURRENT_TIMESTAMP, question_count = ? WHERE id = ?`,
    args: [questionCount, id],
  });
}

// Reference Question interface
export interface ReferenceQuestion {
  id?: number;
  topic: string;
  subtopic?: string;
  division?: 'B' | 'C'; // Science Olympiad division (default: C)
  difficulty: 'Invitational' | 'Regional' | 'State' | 'National';
  questionType: 'multiple-choice' | 'short-answer' | 'calculation' | 'diagram';
  questionText: string;
  correctAnswer: string;
  options?: string[];
  explanation?: string;
  sourceYear?: number;
  sourceTournament?: string;
  sourceUrl?: string;
  tags?: string[];
  qualityScore?: number;
  useCount?: number;
}

// Save a reference question (idempotent - ignores duplicates based on topic+question_text)
export async function saveReferenceQuestion(question: ReferenceQuestion): Promise<number> {
  const database = await getDatabase();
  await initializeReferenceQuestionsTable();

  // Normalize topic name
  const normalizedTopic = normalizeTopic(question.topic);

  const result = await database.execute({
    sql: `INSERT OR IGNORE INTO reference_questions
      (topic, subtopic, division, difficulty, question_type, question_text, correct_answer, options, explanation, source_year, source_tournament, source_url, tags, quality_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      normalizedTopic,
      question.subtopic || null,
      question.division || 'C', // Default to Division C
      question.difficulty,
      question.questionType,
      question.questionText,
      question.correctAnswer,
      question.options ? JSON.stringify(question.options) : null,
      question.explanation || null,
      question.sourceYear || null,
      question.sourceTournament || null,
      question.sourceUrl || null,
      question.tags ? JSON.stringify(question.tags) : null,
      question.qualityScore || 5
    ]
  });

  return Number(result.lastInsertRowid);
}

// Save multiple reference questions in batch
export async function saveReferenceQuestionsBatch(questions: ReferenceQuestion[]): Promise<number> {
  const database = await getDatabase();
  await initializeReferenceQuestionsTable();

  let inserted = 0;
  for (const question of questions) {
    try {
      await saveReferenceQuestion(question);
      inserted++;
    } catch (e) {
      console.error('Failed to save reference question:', e);
    }
  }
  return inserted;
}

// Placeholder answer patterns to filter out from few-shot examples
const PLACEHOLDER_ANSWER_PATTERNS = [
  'see answer key',
  'see key',
  'answer key',
  'not provided',
  'not shown',
  'n/a',
  'tbd',
  'unknown',
];

function isPlaceholderAnswer(answer: string | null | undefined): boolean {
  if (!answer || answer.trim() === '') return true;
  const lower = answer.toLowerCase().trim();
  return PLACEHOLDER_ANSWER_PATTERNS.some(pattern => lower.includes(pattern));
}

// Get reference questions for AI prompt generation
export async function getReferenceQuestions(options: {
  topic: string;
  division?: 'B' | 'C'; // Filter by Science Olympiad division (default: C)
  difficulty?: string;
  questionType?: string;
  limit?: number;
  minQuality?: number;
  requireAnswer?: boolean; // If true, exclude placeholder answers
}): Promise<ReferenceQuestion[]> {
  const database = await getDatabase();
  await initializeReferenceQuestionsTable();

  // Normalize topic name for query
  const normalizedTopic = normalizeTopic(options.topic);

  let sql = `SELECT * FROM reference_questions WHERE topic = ?`;
  const args: any[] = [normalizedTopic];

  // Default to Division C to prevent Division B content from leaking
  const division = options.division || 'C';
  sql += ` AND (division = ? OR division IS NULL)`;
  args.push(division);

  if (options.difficulty) {
    sql += ` AND difficulty = ?`;
    args.push(options.difficulty);
  }

  if (options.questionType) {
    sql += ` AND question_type = ?`;
    args.push(options.questionType);
  }

  if (options.minQuality) {
    sql += ` AND quality_score >= ?`;
    args.push(options.minQuality);
  }

  // Filter out empty/null answers at SQL level (application-level filter handles placeholders)
  if (options.requireAnswer) {
    sql += ` AND correct_answer IS NOT NULL AND correct_answer != ''`;
  }

  // Order by quality and randomize within quality tiers
  // Request more than needed to allow for filtering
  const fetchLimit = (options.limit || 10) * 2;
  sql += ` ORDER BY quality_score DESC, RANDOM() LIMIT ?`;
  args.push(fetchLimit);

  const result = await database.execute({ sql, args });

  // Map to ReferenceQuestion format
  let questions: ReferenceQuestion[] = result.rows.map((r: any) => ({
    id: r.id,
    topic: r.topic,
    subtopic: r.subtopic,
    division: r.division,
    difficulty: r.difficulty,
    questionType: r.question_type,
    questionText: r.question_text,
    correctAnswer: r.correct_answer,
    options: r.options ? JSON.parse(r.options) : undefined,
    explanation: r.explanation,
    sourceYear: r.source_year,
    sourceTournament: r.source_tournament,
    sourceUrl: r.source_url,
    tags: r.tags ? JSON.parse(r.tags) : undefined,
    qualityScore: r.quality_score,
    useCount: r.use_count,
  }));

  // Filter out placeholder answers at application level (catches patterns SQL missed)
  if (options.requireAnswer) {
    questions = questions.filter(q => !isPlaceholderAnswer(q.correctAnswer));
  }

  // Apply the original limit after filtering
  questions = questions.slice(0, options.limit || 10);

  // Update use count for returned questions
  for (const q of questions) {
    if (q.id) {
      await database.execute({
        sql: `UPDATE reference_questions SET use_count = use_count + 1 WHERE id = ?`,
        args: [q.id]
      });
    }
  }

  return questions;
}

// Get random reference questions for variety
export async function getRandomReferenceQuestions(topic: string, count: number = 5): Promise<ReferenceQuestion[]> {
  const database = await getDatabase();
  await initializeReferenceQuestionsTable();

  // Normalize topic name for query
  const normalizedTopic = normalizeTopic(topic);

  const result = await database.execute({
    sql: `SELECT * FROM reference_questions WHERE topic = ? ORDER BY RANDOM() LIMIT ?`,
    args: [normalizedTopic, count]
  });

  return result.rows.map((r: any) => ({
    id: r.id,
    topic: r.topic,
    subtopic: r.subtopic,
    difficulty: r.difficulty,
    questionType: r.question_type,
    questionText: r.question_text,
    correctAnswer: r.correct_answer,
    options: r.options ? JSON.parse(r.options) : undefined,
    explanation: r.explanation,
    sourceYear: r.source_year,
    sourceTournament: r.source_tournament,
    sourceUrl: r.source_url,
    tags: r.tags ? JSON.parse(r.tags) : undefined,
    qualityScore: r.quality_score,
    useCount: r.use_count,
  }));
}

// Get reference question stats
export async function getReferenceQuestionStats(): Promise<{
  totalQuestions: number;
  byTopic: { topic: string; count: number }[];
  byDifficulty: { difficulty: string; count: number }[];
}> {
  const database = await getDatabase();
  await initializeReferenceQuestionsTable();

  const total = await database.execute('SELECT COUNT(*) as count FROM reference_questions');
  const byTopic = await database.execute(
    'SELECT topic, COUNT(*) as count FROM reference_questions GROUP BY topic ORDER BY count DESC'
  );
  const byDifficulty = await database.execute(
    'SELECT difficulty, COUNT(*) as count FROM reference_questions GROUP BY difficulty ORDER BY count DESC'
  );

  return {
    totalQuestions: (total.rows[0] as any)?.count || 0,
    byTopic: byTopic.rows.map((r: any) => ({ topic: r.topic, count: r.count })),
    byDifficulty: byDifficulty.rows.map((r: any) => ({ difficulty: r.difficulty, count: r.count })),
  };
}

// Get per-topic metadata from reference questions for realistic generation
// Simplified: only returns subtopics since we generate MC-only
export interface TopicMeta {
  subtopics: { subtopic: string; count: number }[];
  subtopicCount: number; // Count of questions with subtopics (for accurate display)
  hasData: boolean;
}

export async function getTopicMeta(topic: string, difficulty?: string): Promise<TopicMeta> {
  const database = await getDatabase();
  await initializeReferenceQuestionsTable();

  const normalizedTopic = normalizeTopic(topic);

  // Build query with optional difficulty filter
  const difficultyFilter = difficulty ? ' AND difficulty = ?' : '';
  const args = difficulty ? [normalizedTopic, difficulty] : [normalizedTopic];

  // Get subtopic distribution (only questions with non-empty subtopics)
  const subtopicResult = await database.execute({
    sql: `SELECT subtopic, COUNT(*) as count
          FROM reference_questions
          WHERE topic = ?${difficultyFilter} AND subtopic IS NOT NULL AND subtopic != ''
          GROUP BY subtopic ORDER BY count DESC LIMIT 10`,
    args
  });

  // Get count of questions with subtopics (for accurate "based on N" display)
  const countResult = await database.execute({
    sql: `SELECT COUNT(*) as count
          FROM reference_questions
          WHERE topic = ?${difficultyFilter} AND subtopic IS NOT NULL AND subtopic != ''`,
    args
  });
  const subtopicCount = (countResult.rows[0] as any)?.count || 0;

  if (subtopicResult.rows.length === 0) {
    return {
      subtopics: [],
      subtopicCount: 0,
      hasData: false,
    };
  }

  return {
    subtopics: subtopicResult.rows.map((r: any) => ({
      subtopic: r.subtopic || 'general',
      count: r.count,
    })),
    subtopicCount,
    hasData: true,
  };
}

// Format reference questions for AI prompt (few-shot examples)
export function formatReferenceQuestionsForPrompt(questions: ReferenceQuestion[]): string {
  if (questions.length === 0) return '';

  let formatted = '\n\nHISTORICAL EXAMPLE QUESTIONS (use these as style/quality reference):\n';

  for (const q of questions) {
    formatted += `\n--- Example (${q.difficulty}, ${q.sourceYear || 'Unknown Year'}) ---\n`;
    formatted += `Q: ${q.questionText}\n`;
    if (q.options && q.options.length > 0) {
      formatted += `Options: ${q.options.join(' | ')}\n`;
    }
    formatted += `A: ${q.correctAnswer}\n`;
    if (q.explanation) {
      formatted += `Explanation: ${q.explanation}\n`;
    }
  }

  return formatted;
}
