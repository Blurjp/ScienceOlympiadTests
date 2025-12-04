'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Trophy,
  Clock,
  Target,
  ArrowLeft,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface TestResultWithTest {
  id: string;
  testId: string;
  testTitle: string;
  testTopic: string;
  score: number;
  totalPoints: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<TestResultWithTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadHistory();
    }
  }, [status, router]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGrade = (pct: number): string => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (pct: number): string => {
    if (pct >= 90) return 'bg-green-100 text-green-800';
    if (pct >= 80) return 'bg-blue-100 text-blue-800';
    if (pct >= 70) return 'bg-yellow-100 text-yellow-800';
    if (pct >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="mx-auto h-12 w-12 animate-spin text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">Loading history...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Test History</h1>
          </div>
          <p className="mt-2 text-gray-600">
            View your past test results and track your progress
          </p>
        </div>

        {/* Stats Summary */}
        {results.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-blue-100 p-3">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{results.length}</p>
                  <p className="text-sm text-gray-600">Tests Completed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-green-100 p-3">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)}%
                  </p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-full bg-purple-100 p-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatTime(Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length))}
                  </p>
                  <p className="text-sm text-gray-600">Avg Time/Test</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results List */}
        {results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">No test history yet</p>
              <p className="mt-2 text-gray-600">
                Complete some tests to see your results here
              </p>
              <Link href="/">
                <Button className="mt-6">Browse Tests</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.testTitle}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">{result.testTopic}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(result.completedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-blue-600">
                            {result.percentage}%
                          </span>
                          <Badge className={getGradeColor(result.percentage)}>
                            {getGrade(result.percentage)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </p>
                      </div>

                      <div className="text-center border-l pl-4">
                        <p className="text-lg font-semibold text-gray-700">
                          {result.score}/{result.totalPoints}
                        </p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>

                      <div className="text-center border-l pl-4">
                        <p className="text-lg font-semibold text-gray-700">
                          {formatTime(result.timeSpent)}
                        </p>
                        <p className="text-xs text-gray-500">time</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
