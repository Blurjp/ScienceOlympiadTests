# Science Olympiad Tests App

A comprehensive Science Olympiad test-taking application with PDF parsing capabilities, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **User Authentication**: Secure Google OAuth login with user profiles
- **PDF Parser**: Upload Science Olympiad test PDFs and automatically extract questions
- **Test Browser**: Browse tests by year, topic, and difficulty
- **Interactive Test Taking**:
  - Multiple choice, short answer, calculation, and diagram questions
  - Built-in timer with visual indicators
  - Progress tracking
  - Question navigator
- **Results & Analytics**:
  - Detailed score breakdown
  - Question-by-question review
  - Export results as JSON
  - Track progress across sessions
- **User Profiles**: View your statistics, test history, and account info
- **SQLite Database**: Persistent storage for tests, questions, and user data
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **PDF Parsing**: pdf-parse
- **Icons**: Lucide React
- **State Management**: React hooks + Server Components

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Google OAuth credentials (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ScienceOlympiadTests
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
- `AUTH_SECRET`: Generate using `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Browse Tests

1. Navigate to the home page
2. Select a year to filter tests
3. Click "Start Test" on any test card

### Take a Test

1. Read each question carefully
2. Select or type your answer
3. Use the navigation buttons to move between questions
4. Monitor the timer in the top section
5. Click "Submit Test" when finished

### Upload a PDF Test

1. Click "Upload PDF Test" from the home page
2. Drag and drop or select a PDF file
3. Click "Parse PDF" to extract questions
4. Review and edit the extracted questions
5. Fill in test metadata (title, year, topic, etc.)
6. Click "Save to Library" to add to your tests

### View Results

- See your score and percentage
- Review correct and incorrect answers
- Export results as JSON
- Retake the test or return home

## Project Structure

```
ScienceOlympiadTests/
├── app/
│   ├── api/
│   │   └── parse-pdf/
│   │       └── route.ts          # PDF parsing API endpoint
│   ├── pdf-parser/
│   │   └── page.tsx              # PDF parser interface
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   └── progress.tsx
│   └── scioly/                   # Science Olympiad specific components
│       ├── test-viewer.tsx       # Test taking interface
│       ├── question-display.tsx  # Question renderer
│       ├── timer.tsx             # Timer component
│       ├── pdf-uploader.tsx      # PDF upload interface
│       └── results-screen.tsx    # Results display
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   ├── utils.ts                  # Utility functions
│   └── question-parser.ts        # PDF text parsing logic
└── public/                       # Static assets
```

## Features in Detail

### PDF Parsing

The app uses `pdf-parse` to extract text from PDF files and then uses pattern matching to identify:
- Question numbers
- Multiple choice options (A, B, C, D)
- Question types (calculation, short answer, etc.)
- Question text

### Timer

- Countdown timer with visual progress bar
- Color-coded warnings (green → yellow → red)
- Pause/resume functionality
- Auto-submit when time expires

### Question Types

1. **Multiple Choice**: Select from A, B, C, D options
2. **Short Answer**: Text input field
3. **Calculation**: Numeric input with formula support
4. **Diagram**: Text description of diagram-based questions

### LocalStorage

Tests created via PDF upload are saved to browser localStorage and persist across sessions.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This app can be deployed to any platform that supports Next.js. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Recommended Platforms**:
- **Vercel** (easiest, zero-config)
- **Railway.app** (great for apps with SQLite)
- **Fly.io** (persistent storage support)
- **Netlify** (with Next.js plugin)

For production, consider using **Turso** (distributed SQLite) for the database instead of local SQLite.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
