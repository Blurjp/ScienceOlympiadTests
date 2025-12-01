'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Sparkles, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const REGIONS = ['Invitational', 'Regionals', 'States', 'Nationals'];

export default function GenerateTestPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [config, setConfig] = useState({
    topic: '',
    year: '' as string,
    region: '',
    difficulty: '' as '' | 'Easy' | 'Medium' | 'Hard',
    questionCount: 20,
    timePerQuestion: 120,
    includeTypes: [] as string[],
  });

  useEffect(() => {
    // Fetch available topics and years
    Promise.all([
      fetch('/api/tests?action=topics').then((res) => res.json()),
      fetch('/api/tests?action=years').then((res) => res.json()),
    ])
      .then(([topicsData, yearsData]) => {
        setTopics(topicsData.topics || []);
        setYears(yearsData.years || []);
      })
      .catch((err) => console.error('Failed to fetch data:', err));
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
          year: config.year ? parseInt(config.year) : undefined,
          region: config.region || undefined,
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
            <h1 className="text-3xl font-bold text-gray-900">AI Test Generator</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Generate practice tests based on past Science Olympiad competitions
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">How it works</p>
              <p className="mt-1">
                Tests are generated using questions from past Science Olympiad competitions stored in our database.
                Select a year, region, and topic to get questions that match the style and difficulty of that specific competition.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Select the competition parameters to generate a practice test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic/Event Selection */}
            <div>
              <Label htmlFor="topic">Event/Topic</Label>
              <select
                id="topic"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Events</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select a specific Science Olympiad event or leave blank for mixed questions
              </p>
            </div>

            {/* Year Selection */}
            <div>
              <Label htmlFor="year">Competition Year</Label>
              <select
                id="year"
                value={config.year}
                onChange={(e) => setConfig({ ...config, year: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Questions will be based on tests from this competition year
              </p>
            </div>

            {/* Region Selection */}
            <div>
              <Label htmlFor="region">Competition Level</Label>
              <select
                id="region"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Levels</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Invitational → Regionals → States → Nationals (increasing difficulty)
              </p>
            </div>

            {/* Difficulty Selection */}
            <div>
              <Label htmlFor="difficulty">Difficulty Filter (optional)</Label>
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
                The actual number may be lower if not enough matching questions are available
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
                  <strong>Event:</strong> {config.topic || 'All Events'}
                </p>
                <p>
                  <strong>Year:</strong> {config.year || 'All Years'}
                </p>
                <p>
                  <strong>Level:</strong> {config.region || 'All Levels'}
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
              {(config.topic || config.year || config.region) && (
                <p className="mt-3 text-xs text-purple-600">
                  Questions will be based on {config.year && `${config.year} `}
                  {config.region && `${config.region} `}
                  {config.topic && `${config.topic} `}
                  Science Olympiad tests
                </p>
              )}
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
                  Generate Practice Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Disclaimer Card */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-900">Important Note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            <p>
              Generated tests are created by randomly selecting and shuffling questions from past
              Science Olympiad competitions stored in our database. The questions reflect the style
              and content of the selected year and competition level.
            </p>
            <p className="mt-2">
              For the best practice experience, we recommend selecting a specific year, level, and
              event that matches your upcoming competition.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
