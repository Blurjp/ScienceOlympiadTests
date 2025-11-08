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
  Sparkles,
  Trophy,
  Download,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>('browse');
  const [tests, setTests] = useState<Test[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load tests from database on mount
  useEffect(() => {
    loadTests();
    loadYears();
  }, []);

  // Reload when year changes
  useEffect(() => {
    if (selectedYear !== null) {
      loadTests(selectedYear);
    }
  }, [selectedYear]);

  const loadTests = async (year?: number) => {
    setIsLoading(true);
    try {
      const url = year ? `/api/tests?year=${year}` : '/api/tests';
      const response = await fetch(url);
      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadYears = async () => {
    try {
      const response = await fetch('/api/tests?action=years');
      const data = await response.json();
      const years = data.years || [];
      setAvailableYears(years);
      if (years.length > 0 && selectedYear === null) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('Error loading years:', error);
    }
  };

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
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/pdf-parser">
              <Button size="lg" variant="secondary" className="gap-2">
                <Upload className="h-5 w-5" />
                Upload PDF Test
              </Button>
            </Link>
            <Link href="/import">
              <Button size="lg" variant="secondary" className="gap-2">
                <Download className="h-5 w-5" />
                Import from URL
              </Button>
            </Link>
            <Link href="/generate">
              <Button size="lg" variant="secondary" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Test
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => loadTests(selectedYear || undefined)}
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </Button>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Browse Tests</h2>
            {selectedYear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedYear(null);
                  loadTests();
                }}
              >
                View All Years
              </Button>
            )}
          </div>
          {availableYears.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedYear === null ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedYear(null);
                  loadTests();
                }}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                All Years
              </Button>
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
          ) : (
            <p className="text-gray-600">No tests in database yet. Import some tests to get started!</p>
          )}
        </div>

        {/* Test Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="mx-auto h-12 w-12 animate-spin text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">Loading tests...</p>
            </CardContent>
          </Card>
        ) : tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                No tests available{selectedYear ? ` for ${selectedYear}` : ''}
              </p>
              <p className="mt-2 text-gray-600">
                Get started by importing tests or uploading PDFs
              </p>
              <div className="mt-6 flex gap-3 justify-center flex-wrap">
                <Link href="/import">
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Import from URL
                  </Button>
                </Link>
                <Link href="/pdf-parser">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload PDF
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
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
