'use client';

import React from 'react';
import { Question, UserAnswer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  userAnswer?: string;
  onAnswerChange: (answer: string) => void;
  showResults?: boolean;
  isCorrect?: boolean;
}

export function QuestionDisplay({
  question,
  questionNumber,
  userAnswer = '',
  onAnswerChange,
  showResults = false,
  isCorrect,
}: QuestionDisplayProps) {
  const handleOptionClick = (option: string) => {
    if (!showResults) {
      onAnswerChange(option);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            Question {questionNumber}
            <span className="ml-3 text-sm font-normal text-gray-500">
              ({question.points} {question.points === 1 ? 'point' : 'points'})
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{question.category}</Badge>
            <Badge variant="secondary">
              {question.type === 'multiple-choice' ? 'Multiple Choice' :
               question.type === 'short-answer' ? 'Short Answer' :
               question.type === 'calculation' ? 'Calculation' : 'Diagram'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-6 text-base leading-relaxed">{question.question}</p>

        {question.type === 'multiple-choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = userAnswer === option;
              const isCorrectOption = showResults && option === question.correctAnswer;
              const isWrongSelection = showResults && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  disabled={showResults}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showResults
                      ? isCorrectOption
                        ? 'border-green-500 bg-green-50'
                        : isWrongSelection
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                  } ${showResults ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                        showResults
                          ? isCorrectOption
                            ? 'border-green-600 bg-green-600 text-white'
                            : isWrongSelection
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-gray-400 bg-white text-gray-600'
                          : isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-400 bg-white text-gray-600'
                      }`}
                    >
                      {optionLabel}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {(question.type === 'short-answer' ||
          question.type === 'calculation' ||
          question.type === 'diagram') && (
          <div>
            <Label htmlFor={`answer-${question.id}`} className="mb-2 block">
              Your Answer
            </Label>
            <Textarea
              id={`answer-${question.id}`}
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={showResults}
              placeholder="Type your answer here..."
              rows={4}
              className={
                showResults
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : ''
              }
            />
            {showResults && (
              <div className="mt-3 rounded-md bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                <p className="mt-1 text-sm text-gray-900">{question.correctAnswer}</p>
              </div>
            )}
          </div>
        )}

        {showResults && (
          <div className={`mt-4 rounded-md p-3 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
