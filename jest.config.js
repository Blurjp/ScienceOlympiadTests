/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        jsx: 'react-jsx',
      },
    }],
  },
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    // Exclude files that require database/external service integration
    '!lib/database.ts',
    // Exclude complex AI routes (require OpenAI integration tests)
    '!app/api/generate-ai-test/**',
    '!app/api/generate-from-pdf/**',
    '!app/api/parse-pdf/**',
    '!app/api/parse-pdf-vision/**',
    '!app/api/download-pdf/**',
    // Exclude NextAuth passthrough route
    '!app/api/auth/**',
    // Exclude complex React components that need integration testing
    '!components/scioly/pdf-uploader.tsx',
    '!components/scioly/test-viewer.tsx',
    '!components/scioly/results-screen.tsx',
    '!components/scioly/question-display.tsx',
    // Exclude third-party integration components
    '!components/adsense.tsx',
    // Exclude async server components
    '!components/header.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

module.exports = config;
