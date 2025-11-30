'use client';

import React, { useState } from 'react';
import { Test, UserAnswer } from '@/lib/types';
import { QuestionDisplay } from './question-display';
import { Timer } from './timer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface TestViewerProps {
  test: Test;
  onSubmit: (answers: UserAnswer[], timeSpent: number) => void;
  onBack: () => void;
}

export function TestViewer({ test, onSubmit, onBack }: TestViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(test.totalTime);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  const handleAnswerChange = (answer: string) => {
    const existingAnswerIndex = userAnswers.findIndex(
      (ua) => ua.questionId === currentQuestion.id
    );

    if (existingAnswerIndex >= 0) {
      const newAnswers = [...userAnswers];
      newAnswers[existingAnswerIndex].answer = answer;
      setUserAnswers(newAnswers);
    } else {
      setUserAnswers([...userAnswers, { questionId: currentQuestion.id, answer }]);
    }
  };

  const currentAnswer = userAnswers.find(
    (ua) => ua.questionId === currentQuestion.id
  )?.answer || '';

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const timeSpent = test.totalTime - timeRemaining;
    setIsTimerRunning(false);

    if (confirm('Are you sure you want to submit your test? This action cannot be undone.')) {
      onSubmit(userAnswers, timeSpent);
    } else {
      setIsTimerRunning(true);
    }
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    const timeSpent = test.totalTime;
    // Auto-submit when time is up (no confirmation needed)
    onSubmit(userAnswers, timeSpent);
  };

  const answeredQuestions = userAnswers.filter(ua => ua.answer.trim() !== '').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Browse
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
          <p className="mt-2 text-gray-600">{test.description}</p>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <Timer
            totalTime={test.totalTime}
            timeRemaining={timeRemaining}
            isRunning={isTimerRunning}
            onToggle={() => setIsTimerRunning(!isTimerRunning)}
            onTimeUpdate={setTimeRemaining}
            onTimeUp={handleTimeUp}
          />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {answeredQuestions} / {test.questions.length} answered
            </span>
          </div>
          <Progress value={progress} max={100} />
        </div>

        {/* Question */}
        <div className="mb-6">
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            userAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === test.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="gap-2"
                variant="default"
              >
                <CheckCircle className="h-4 w-4" />
                Submit Test
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((q, index) => {
              const isAnswered = userAnswers.some(
                ua => ua.questionId === q.id && ua.answer.trim() !== ''
              );
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-10 w-10 rounded-md text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
