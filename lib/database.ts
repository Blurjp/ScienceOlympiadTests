import Database from 'better-sqlite3';
import { Test, Question } from './types';
import path from 'path';

const dbPath = path.join(process.cwd(), 'scioly.db');
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tests table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
      total_time INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      topic TEXT NOT NULL,
      source_url TEXT,
      pdf_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create questions table
  database.exec(`
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
  database.exec(`
    CREATE TABLE IF NOT EXISTS question_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      option_text TEXT NOT NULL,
      option_order INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  // Create test_results table
  database.exec(`
    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      percentage REAL NOT NULL,
      correct_answers INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      time_spent INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_tests_year ON tests(year);
    CREATE INDEX IF NOT EXISTS idx_tests_topic ON tests(topic);
    CREATE INDEX IF NOT EXISTS idx_tests_difficulty ON tests(difficulty);
    CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
    CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
  `);
}

// Test operations
export function saveTest(test: Test, sourceUrl?: string, pdfPath?: string) {
  const db = getDatabase();

  const insertTest = db.prepare(`
    INSERT OR REPLACE INTO tests
    (id, year, title, description, difficulty, total_time, total_points, topic, source_url, pdf_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTest.run(
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
  );

  // Delete existing questions for this test
  const deleteQuestions = db.prepare('DELETE FROM questions WHERE test_id = ?');
  deleteQuestions.run(test.id);

  // Insert questions
  const insertQuestion = db.prepare(`
    INSERT INTO questions
    (id, test_id, type, question, correct_answer, points, category, question_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOption = db.prepare(`
    INSERT INTO question_options (question_id, option_text, option_order)
    VALUES (?, ?, ?)
  `);

  test.questions.forEach((question, index) => {
    insertQuestion.run(
      question.id,
      test.id,
      question.type,
      question.question,
      question.correctAnswer,
      question.points,
      question.category,
      index
    );

    if (question.options) {
      question.options.forEach((option, optIndex) => {
        insertOption.run(question.id, option, optIndex);
      });
    }
  });
}

export function getTest(testId: string): Test | null {
  const db = getDatabase();

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId) as any;
  if (!test) return null;

  const questions = db
    .prepare('SELECT * FROM questions WHERE test_id = ? ORDER BY question_order')
    .all(testId) as any[];

  const questionWithOptions: Question[] = questions.map((q) => {
    const options = db
      .prepare('SELECT option_text FROM question_options WHERE question_id = ? ORDER BY option_order')
      .all(q.id) as any[];

    return {
      id: q.id,
      type: q.type,
      question: q.question,
      correctAnswer: q.correct_answer,
      points: q.points,
      category: q.category,
      options: options.length > 0 ? options.map((o) => o.option_text) : undefined,
    };
  });

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

export function getAllTests(): Test[] {
  const db = getDatabase();
  const tests = db.prepare('SELECT id FROM tests ORDER BY year DESC, title').all() as any[];
  return tests.map((t) => getTest(t.id)).filter((t) => t !== null) as Test[];
}

export function getTestsByYear(year: number): Test[] {
  const db = getDatabase();
  const tests = db.prepare('SELECT id FROM tests WHERE year = ? ORDER BY title').all(year) as any[];
  return tests.map((t) => getTest(t.id)).filter((t) => t !== null) as Test[];
}

export function getTestsByTopic(topic: string): Test[] {
  const db = getDatabase();
  const tests = db.prepare('SELECT id FROM tests WHERE topic = ? ORDER BY year DESC, title').all(topic) as any[];
  return tests.map((t) => getTest(t.id)).filter((t) => t !== null) as Test[];
}

export function searchQuestions(filters: {
  topic?: string;
  category?: string;
  type?: string;
  difficulty?: string;
}): Question[] {
  const db = getDatabase();

  let query = `
    SELECT DISTINCT q.* FROM questions q
    JOIN tests t ON q.test_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.topic) {
    query += ' AND t.topic = ?';
    params.push(filters.topic);
  }

  if (filters.category) {
    query += ' AND q.category = ?';
    params.push(filters.category);
  }

  if (filters.type) {
    query += ' AND q.type = ?';
    params.push(filters.type);
  }

  if (filters.difficulty) {
    query += ' AND t.difficulty = ?';
    params.push(filters.difficulty);
  }

  const questions = db.prepare(query).all(...params) as any[];

  return questions.map((q) => {
    const options = db
      .prepare('SELECT option_text FROM question_options WHERE question_id = ? ORDER BY option_order')
      .all(q.id) as any[];

    return {
      id: q.id,
      type: q.type,
      question: q.question,
      correctAnswer: q.correct_answer,
      points: q.points,
      category: q.category,
      options: options.length > 0 ? options.map((o) => o.option_text) : undefined,
    };
  });
}

export function getAvailableYears(): number[] {
  const db = getDatabase();
  const years = db.prepare('SELECT DISTINCT year FROM tests ORDER BY year DESC').all() as any[];
  return years.map((y) => y.year);
}

export function getAvailableTopics(): string[] {
  const db = getDatabase();
  const topics = db.prepare('SELECT DISTINCT topic FROM tests ORDER BY topic').all() as any[];
  return topics.map((t) => t.topic);
}

export function deleteTest(testId: string) {
  const db = getDatabase();
  const deleteStmt = db.prepare('DELETE FROM tests WHERE id = ?');
  deleteStmt.run(testId);
}

// User operations
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export function createUser(id: string, email: string, name: string, passwordHash: string): void {
  const db = getDatabase();
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role)
    VALUES (?, ?, ?, ?, 'user')
  `);
  insertUser.run(id, email, name, passwordHash);
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password_hash,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function getUserById(id: string): User | null {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password_hash,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
