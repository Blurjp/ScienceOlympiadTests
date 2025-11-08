'use client';

import React, { useState, useEffect } from 'react';
import { Test, UserAnswer, ViewType } from '@/lib/types';
import { TestViewer } from '@/components/scioly/test-viewer';
import { ResultsScreen } from '@/components/scioly/results-screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDifficultyColor } from '@/lib/utils';
import {
  BookOpen,
  Clock,
  FileQuestion,
  Upload,
  Calendar,
  Target,
  Plus,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

// Sample tests for demonstration
const sampleTests: Test[] = [
  {
    id: 'sample-1',
    year: 2024,
    title: 'Biology Division C - Sample',
    description: 'Practice test covering cell biology, genetics, and ecology',
    difficulty: 'Medium',
    totalTime: 3000, // 50 minutes
    totalPoints: 100,
    topic: 'Biology',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
        correctAnswer: 'Mitochondria',
        points: 2,
        category: 'Cell Biology',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Which organelle is responsible for protein synthesis?',
        options: ['Golgi apparatus', 'Lysosome', 'Ribosome', 'Vacuole'],
        correctAnswer: 'Ribosome',
        points: 2,
        category: 'Cell Biology',
      },
      {
        id: 'q3',
        type: 'short-answer',
        question: 'Describe the process of photosynthesis in plants.',
        correctAnswer: 'Photosynthesis is the process by which plants convert light energy into chemical energy, using carbon dioxide and water to produce glucose and oxygen.',
        points: 5,
        category: 'Plant Biology',
      },
    ],
  },
  {
    id: 'sample-2',
    year: 2024,
    title: 'Chemistry Division C - Sample',
    description: 'Practice test covering atomic structure, chemical reactions, and stoichiometry',
    difficulty: 'Hard',
    totalTime: 3600, // 60 minutes
    totalPoints: 120,
    topic: 'Chemistry',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the atomic number of Carbon?',
        options: ['4', '6', '8', '12'],
        correctAnswer: '6',
        points: 1,
        category: 'Atomic Structure',
      },
      {
        id: 'q2',
        type: 'calculation',
        question: 'Calculate the molecular weight of H2O (Hydrogen = 1, Oxygen = 16)',
        correctAnswer: '18',
        points: 3,
        category: 'Stoichiometry',
      },
    ],
  },
];

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>('browse');
  const [tests, setTests] = useState<Test[]>(sampleTests);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);

  // Load tests from localStorage on mount
  useEffect(() => {
    const savedTests = localStorage.getItem('scioly-tests');
    if (savedTests) {
      try {
        const parsed = JSON.parse(savedTests);
        setTests([...sampleTests, ...parsed]);
      } catch (e) {
        console.error('Error loading saved tests:', e);
      }
    }
  }, []);

  const handleStartTest = (test: Test) => {
    setSelectedTest(test);
    setUserAnswers([]);
    setTimeSpent(0);
    setCurrentView('test');
  };

  const handleSubmitTest = (answers: UserAnswer[], timeSpent: number) => {
    setUserAnswers(answers);
    setTimeSpent(timeSpent);
    setCurrentView('results');
  };

  const handleRetakeTest = () => {
    if (selectedTest) {
      handleStartTest(selectedTest);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('browse');
    setSelectedTest(null);
    setUserAnswers([]);
  };

  const availableYears = Array.from(
    new Set(tests.map((t) => t.year))
  ).sort((a, b) => b - a);

  const filteredTests = tests.filter((t) => t.year === selectedYear);

  // Render based on current view
  if (currentView === 'test' && selectedTest) {
    return (
      <TestViewer
        test={selectedTest}
        onSubmit={handleSubmitTest}
        onBack={handleBackToHome}
      />
    );
  }

  if (currentView === 'results' && selectedTest) {
    return (
      <ResultsScreen
        test={selectedTest}
        userAnswers={userAnswers}
        timeSpent={timeSpent}
        onRetakeTest={handleRetakeTest}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // Browse view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Science Olympiad Tests</h1>
          </div>
          <p className="text-xl text-blue-100">
            Practice tests, track your progress, and ace your Science Olympiad competitions
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/pdf-parser">
              <Button size="lg" variant="secondary" className="gap-2">
                <Upload className="h-5 w-5" />
                Upload PDF Test
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-blue-100 p-3">
                <FileQuestion className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tests.length}</p>
                <p className="text-sm text-gray-600">Available Tests</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-100 p-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tests.reduce((sum, t) => sum + t.questions.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Questions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-purple-100 p-3">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableYears.length}</p>
                <p className="text-sm text-gray-600">Years Covered</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Year Selector */}
        <div className="mb-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Browse Tests</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                onClick={() => setSelectedYear(year)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Test Grid */}
        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                No tests available for {selectedYear}
              </p>
              <p className="mt-2 text-gray-600">
                Try selecting a different year or upload a new test
              </p>
              <Link href="/pdf-parser">
                <Button className="mt-6 gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Test PDF
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTests.map((test) => (
              <Card
                key={test.id}
                className="transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <Badge className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileQuestion className="h-4 w-4" />
                      <span>{test.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{Math.round(test.totalTime / 60)} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>{test.totalPoints} points</span>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {test.topic}
                    </Badge>
                  </div>

                  <Button
                    onClick={() => handleStartTest(test)}
                    className="mt-6 w-full"
                  >
                    Start Test
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
