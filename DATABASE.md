# Database Features

## Overview

The Science Olympiad Tests app now uses SQLite database for persistent storage of tests and questions, replacing the previous localStorage approach.

## Features

### 1. SQLite Database Storage

- **Location**: `scioly.db` in the project root
- **Library**: better-sqlite3 (synchronous, fast SQLite wrapper)
- **Schema**: Relational database with proper foreign keys and indexes

### 2. Database Schema

#### Tables

**tests**
- `id` (TEXT, PRIMARY KEY)
- `year` (INTEGER)
- `title` (TEXT)
- `description` (TEXT)
- `difficulty` (TEXT: Easy/Medium/Hard)
- `total_time` (INTEGER, seconds)
- `total_points` (INTEGER)
- `topic` (TEXT)
- `source_url` (TEXT, optional)
- `pdf_path` (TEXT, optional)
- `created_at`, `updated_at` (DATETIME)

**questions**
- `id` (TEXT, PRIMARY KEY)
- `test_id` (TEXT, FOREIGN KEY)
- `type` (TEXT: multiple-choice/short-answer/diagram/calculation)
- `question` (TEXT)
- `correct_answer` (TEXT)
- `points` (INTEGER)
- `category` (TEXT)
- `question_order` (INTEGER)
- `created_at` (DATETIME)

**question_options**
- `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
- `question_id` (TEXT, FOREIGN KEY)
- `option_text` (TEXT)
- `option_order` (INTEGER)

**test_results**
- `id` (TEXT, PRIMARY KEY)
- `test_id` (TEXT, FOREIGN KEY)
- `score`, `total_points`, `percentage` (INTEGER/REAL)
- `correct_answers`, `total_questions` (INTEGER)
- `time_spent` (INTEGER, seconds)
- `completed_at` (DATETIME)

### 3. API Endpoints

#### Test Management

- `GET /api/tests` - Get all tests
- `GET /api/tests?year=2024` - Get tests by year
- `GET /api/tests?topic=Biology` - Get tests by topic
- `GET /api/tests?action=years` - Get available years
- `GET /api/tests?action=topics` - Get available topics
- `GET /api/tests/[id]` - Get specific test
- `DELETE /api/tests/[id]` - Delete test
- `POST /api/save-test` - Save new test

#### PDF Operations

- `POST /api/parse-pdf` - Parse PDF file to extract questions
- `POST /api/download-pdf` - Download PDF from URL and parse

#### Test Generation

- `POST /api/generate-test` - Generate practice test from database questions

### 4. Import from URL

Navigate to `/import` to batch import tests from URLs:

1. Add single URLs with metadata (title, year, topic, difficulty)
2. Bulk import multiple URLs at once
3. Track import progress with status indicators
4. Automatically parse and save to database

### 5. Generate Practice Tests

Navigate to `/generate` to create custom practice tests:

1. Filter by topic, difficulty, question type
2. Set number of questions and time per question
3. System randomly selects and shuffles questions
4. Generated tests are saved to database

## Usage Examples

### Importing a Test from URL

```javascript
const response = await fetch('/api/download-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/test.pdf',
    metadata: {
      title: 'Biology Division C 2024',
      year: 2024,
      topic: 'Biology',
      difficulty: 'Medium',
      totalTime: 3600
    }
  })
});
```

### Generating a Practice Test

```javascript
const response = await fetch('/api/generate-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Chemistry',
    difficulty: 'Hard',
    questionCount: 20,
    timePerQuestion: 120,
    includeTypes: ['multiple-choice', 'calculation']
  })
});
```

### Searching Questions

```javascript
import { searchQuestions } from '@/lib/database';

const questions = searchQuestions({
  topic: 'Physics',
  category: 'Mechanics',
  type: 'calculation',
  difficulty: 'Medium'
});
```

## Database Operations

All database operations are abstracted in `/lib/database.ts`:

- `saveTest(test, sourceUrl?, pdfPath?)` - Save test to database
- `getTest(testId)` - Retrieve test with questions
- `getAllTests()` - Get all tests
- `getTestsByYear(year)` - Filter by year
- `getTestsByTopic(topic)` - Filter by topic
- `searchQuestions(filters)` - Search with multiple criteria
- `getAvailableYears()` - Get unique years
- `getAvailableTopics()` - Get unique topics
- `deleteTest(testId)` - Delete test and cascade to questions

## Database Initialization

The database is automatically initialized on first use:
- Tables are created if they don't exist
- Indexes are created for performance
- Foreign key constraints are enabled
- WAL mode is enabled for better concurrency

## Migration Notes

If upgrading from the localStorage version:

1. Old tests in localStorage are NOT automatically migrated
2. You can re-import tests using the import feature
3. All new tests will be saved to the SQLite database
4. The database file (`scioly.db`) is in `.gitignore` by default

## Performance

- Indexes on commonly queried fields (year, topic, difficulty)
- WAL mode for improved write concurrency
- Prepared statements for better query performance
- Server-side only (better-sqlite3 doesn't run in browser)

## Backup and Export

The database file can be backed up by simply copying `scioly.db`. Results can be exported as JSON via the results screen.

## Future Enhancements

Potential improvements:
- Automated database backups
- Export/import database to JSON
- Test result analytics and statistics
- User accounts and progress tracking
- Advanced search with full-text search
- Test scheduling and reminders
