'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GenerateTestPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [config, setConfig] = useState({
    topic: '',
    difficulty: '' as '' | 'Easy' | 'Medium' | 'Hard',
    questionCount: 20,
    timePerQuestion: 120,
    includeTypes: [] as string[],
  });

  useEffect(() => {
    // Fetch available topics
    fetch('/api/tests?action=topics')
      .then((res) => res.json())
      .then((data) => setTopics(data.topics || []))
      .catch((err) => console.error('Failed to fetch topics:', err));
  }, []);

  const toggleType = (type: string) => {
    if (config.includeTypes.includes(type)) {
      setConfig({
        ...config,
        includeTypes: config.includeTypes.filter((t) => t !== type),
      });
    } else {
      setConfig({
        ...config,
        includeTypes: [...config.includeTypes, type],
      });
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: config.topic || undefined,
          difficulty: config.difficulty || undefined,
          questionCount: config.questionCount,
          timePerQuestion: config.timePerQuestion,
          includeTypes: config.includeTypes.length > 0 ? config.includeTypes : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to home and select the generated test
        router.push('/?generated=' + result.test.id);
      } else {
        alert(result.error || 'Failed to generate test');
      }
    } catch (error) {
      console.error('Failed to generate test:', error);
      alert('Failed to generate test. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'calculation', label: 'Calculation' },
    { value: 'diagram', label: 'Diagram' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Generate Practice Test</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Create a custom practice test from stored questions in the database
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure your practice test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Selection */}
            <div>
              <Label htmlFor="topic">Topic (optional)</Label>
              <select
                id="topic"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to include questions from all topics
              </p>
            </div>

            {/* Difficulty Selection */}
            <div>
              <Label htmlFor="difficulty">Difficulty (optional)</Label>
              <select
                id="difficulty"
                value={config.difficulty}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    difficulty: e.target.value as '' | 'Easy' | 'Medium' | 'Hard',
                  })
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Input
                id="questionCount"
                type="number"
                min="1"
                max="100"
                value={config.questionCount}
                onChange={(e) =>
                  setConfig({ ...config, questionCount: parseInt(e.target.value) || 20 })
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                The actual number may be lower if not enough questions are available
              </p>
            </div>

            {/* Time Per Question */}
            <div>
              <Label htmlFor="timePerQuestion">Time Per Question (seconds)</Label>
              <Input
                id="timePerQuestion"
                type="number"
                min="30"
                max="600"
                value={config.timePerQuestion}
                onChange={(e) =>
                  setConfig({ ...config, timePerQuestion: parseInt(e.target.value) || 120 })
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                Total time: {Math.round((config.questionCount * config.timePerQuestion) / 60)}{' '}
                minutes
              </p>
            </div>

            {/* Question Types */}
            <div>
              <Label>Question Types (optional)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {questionTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      config.includeTypes.includes(type.value)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Leave none selected to include all question types
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-purple-50 p-4">
              <h3 className="mb-2 font-semibold text-purple-900">Test Summary</h3>
              <div className="space-y-1 text-sm text-purple-700">
                <p>
                  <strong>Topic:</strong> {config.topic || 'All Topics'}
                </p>
                <p>
                  <strong>Difficulty:</strong> {config.difficulty || 'Mixed'}
                </p>
                <p>
                  <strong>Questions:</strong> {config.questionCount}
                </p>
                <p>
                  <strong>Total Time:</strong>{' '}
                  {Math.round((config.questionCount * config.timePerQuestion) / 60)} minutes
                </p>
                {config.includeTypes.length > 0 && (
                  <p>
                    <strong>Types:</strong>{' '}
                    {config.includeTypes
                      .map(
                        (t) => questionTypes.find((qt) => qt.value === t)?.label || t
                      )
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Test...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              • The system randomly selects questions from your database based on the
              criteria you specify
            </p>
            <p>• Questions are shuffled to create a unique test each time</p>
            <p>
              • Generated tests are saved to the database and can be taken multiple times
            </p>
            <p>
              • If not enough questions match your criteria, the test will include fewer
              questions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
