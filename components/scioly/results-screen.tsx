'use client';

import React from 'react';
import { Test, UserAnswer, TestResult } from '@/lib/types';
import { QuestionDisplay } from './question-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateScore, formatTime } from '@/lib/utils';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  Download,
  RotateCcw,
} from 'lucide-react';

interface ResultsScreenProps {
  test: Test;
  userAnswers: UserAnswer[];
  timeSpent: number;
  onRetakeTest: () => void;
  onBackToHome: () => void;
}

export function ResultsScreen({
  test,
  userAnswers,
  timeSpent,
  onRetakeTest,
  onBackToHome,
}: ResultsScreenProps) {
  const { score, correctAnswers, totalPoints } = calculateScore(
    userAnswers,
    test.questions
  );

  const percentage = Math.round((score / totalPoints) * 100);
  const passingGrade = 70;
  const passed = percentage >= passingGrade;

  const getGrade = (pct: number): string => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const handleExportResults = () => {
    const result: TestResult = {
      testId: test.id,
      score,
      totalPoints,
      percentage,
      answers: userAnswers,
      correctAnswers,
      totalQuestions: test.questions.length,
      timeSpent,
      completedAt: new Date(),
    };

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.title.replace(/\s+/g, '_')}_results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
          <p className="mt-2 text-gray-600">{test.title}</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className={`h-6 w-6 ${passed ? 'text-yellow-500' : 'text-gray-400'}`} />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-blue-600">
                      {percentage}%
                    </span>
                    <span className="text-2xl font-semibold text-gray-600">
                      ({getGrade(percentage)})
                    </span>
                  </div>
                  <Progress value={percentage} max={100} className="mt-4" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Earned:</span>
                    <span className="font-semibold">
                      {score} / {totalPoints}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions Correct:</span>
                    <span className="font-semibold">
                      {correctAnswers} / {test.questions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Spent:</span>
                    <span className="font-semibold">{formatTime(timeSpent)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div
                  className={`rounded-lg p-6 text-center ${
                    passed ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {passed ? (
                    <>
                      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                      <p className="mt-3 text-lg font-semibold text-green-900">
                        Congratulations!
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        You passed the test
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="mx-auto h-12 w-12 text-red-600" />
                      <p className="mt-3 text-lg font-semibold text-red-900">
                        Keep Practicing
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        You need {passingGrade}% to pass
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <Button onClick={onRetakeTest} variant="outline" className="flex-1 gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Retake Test
                  </Button>
                  <Button onClick={handleExportResults} variant="outline" className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question by Question Breakdown */}
        <div className="mb-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Question Breakdown
          </h2>

          <div className="space-y-6">
            {test.questions.map((question, index) => {
              const userAnswer = userAnswers.find(
                (ua) => ua.questionId === question.id
              );
              const isCorrect =
                userAnswer?.answer.trim().toLowerCase() ===
                question.correctAnswer.trim().toLowerCase();

              return (
                <QuestionDisplay
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                  userAnswer={userAnswer?.answer || ''}
                  onAnswerChange={() => {}}
                  showResults={true}
                  isCorrect={isCorrect}
                />
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={onBackToHome} className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Button onClick={onRetakeTest} variant="secondary" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Take Another Test
          </Button>
        </div>
      </div>
    </div>
  );
}
