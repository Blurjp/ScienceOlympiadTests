'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Test, UserAnswer, ViewType, Region } from '@/lib/types';
import { TestViewer } from '@/components/scioly/test-viewer';
import { ResultsScreen } from '@/components/scioly/results-screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Beaker,
  Loader2,
  Info,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

// Static options for when database is empty
const DEFAULT_YEARS = [2024, 2023, 2022, 2021, 2020, 2019];
const DEFAULT_TOPICS = [
  'Anatomy and Physiology',
  'Astronomy',
  'Chemistry Lab',
  'Disease Detectives',
  'Dynamic Planet',
  'Ecology',
  'Experimental Design',
  'Fermi Questions',
  'Forensics',
  'Fossils',
  'Microbe Mission',
  'Optics',
  'Ornithology',
  'Reach for the Stars',
  'Rocks and Minerals',
  'Tower',
  'Wind Power',
  'Write It Do It',
];
const REGIONS: Region[] = ['Invitational', 'Regionals', 'States', 'Nationals'];

export default function HomePage() {
  const { data: session } = useSession();
  const [currentView, setCurrentView] = useState<ViewType>('browse');
  const [tests, setTests] = useState<Test[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState({
    topic: '',
    year: '',
    region: '',
    questionCount: 20,
  });

  // Load tests from database on mount
  useEffect(() => {
    loadTests();
    loadYears();
    loadTopics();
  }, []);

  // Reload when year or topic changes
  useEffect(() => {
    loadTests(selectedYear ?? undefined, selectedTopic ?? undefined);
  }, [selectedYear, selectedTopic]);

  const loadTests = async (year?: number, topic?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (topic) params.append('topic', topic);
      const url = params.toString() ? `/api/tests?${params}` : '/api/tests';
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
      setAvailableYears(years.length > 0 ? years : DEFAULT_YEARS);
    } catch (error) {
      console.error('Error loading years:', error);
      setAvailableYears(DEFAULT_YEARS);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/tests?action=topics');
      const data = await response.json();
      const topics = data.topics || [];
      setAvailableTopics(topics.length > 0 ? topics : DEFAULT_TOPICS);
    } catch (error) {
      console.error('Error loading topics:', error);
      setAvailableTopics(DEFAULT_TOPICS);
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

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genConfig.topic || undefined,
          year: genConfig.year ? parseInt(genConfig.year) : undefined,
          region: genConfig.region || undefined,
          questionCount: genConfig.questionCount,
          timePerQuestion: 120,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Reload tests and start the generated test
        await loadTests();
        await loadYears();
        await loadTopics();
        handleStartTest(result.test);
      } else {
        alert(result.error || 'Failed to generate test. Make sure there are questions in the database matching your criteria.');
      }
    } catch (error) {
      console.error('Failed to generate test:', error);
      alert('Failed to generate test. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
        userId={session?.user?.id}
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
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* AI Test Generator Section */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <CardTitle>AI Test Generator</CardTitle>
            </div>
            <CardDescription>
              Generate practice tests based on past Science Olympiad competitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Tests are generated using questions from past competitions in our database.
                  Select criteria to get questions matching that specific competition style.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Event/Topic */}
              <div>
                <Label htmlFor="gen-topic" className="text-sm">Event/Topic</Label>
                <select
                  id="gen-topic"
                  value={genConfig.topic}
                  onChange={(e) => setGenConfig({ ...genConfig, topic: e.target.value })}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All Events</option>
                  {(availableTopics.length > 0 ? availableTopics : DEFAULT_TOPICS).map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <Label htmlFor="gen-year" className="text-sm">Year</Label>
                <select
                  id="gen-year"
                  value={genConfig.year}
                  onChange={(e) => setGenConfig({ ...genConfig, year: e.target.value })}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All Years</option>
                  {(availableYears.length > 0 ? availableYears : DEFAULT_YEARS).map((year) => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <Label htmlFor="gen-region" className="text-sm">Competition Level</Label>
                <select
                  id="gen-region"
                  value={genConfig.region}
                  onChange={(e) => setGenConfig({ ...genConfig, region: e.target.value })}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All Levels</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Question Count */}
              <div>
                <Label htmlFor="gen-count" className="text-sm">Questions</Label>
                <Input
                  id="gen-count"
                  type="number"
                  min="5"
                  max="50"
                  value={genConfig.questionCount}
                  onChange={(e) => setGenConfig({ ...genConfig, questionCount: parseInt(e.target.value) || 20 })}
                  className="mt-1"
                />
              </div>

              {/* Generate Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateTest}
                  disabled={isGenerating}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {(genConfig.topic || genConfig.year || genConfig.region) && (
              <p className="mt-3 text-sm text-purple-700">
                Will generate test based on {genConfig.year && `${genConfig.year} `}
                {genConfig.region && `${genConfig.region} `}
                {genConfig.topic && `${genConfig.topic} `}
                Science Olympiad questions
              </p>
            )}
          </CardContent>
        </Card>

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
                <p className="text-2xl font-bold">
                  {new Set(tests.map(t => t.topic)).size || availableTopics.length}
                </p>
                <p className="text-sm text-gray-600">Events Covered</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Browse Tests</h2>
            {(selectedYear || selectedTopic) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedYear(null);
                  setSelectedTopic(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Year Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Filter by Year
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedYear === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear(null)}
              >
                All Years
              </Button>
              {(availableYears.length > 0 ? availableYears : DEFAULT_YEARS).map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          {/* Topic Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Filter by Topic
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedTopic === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTopic(null)}
              >
                All Topics
              </Button>
              {(availableTopics.length > 0 ? availableTopics : DEFAULT_TOPICS).slice(0, 10).map((topic) => (
                <Button
                  key={topic}
                  variant={selectedTopic === topic ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTopic(topic)}
                >
                  {topic}
                </Button>
              ))}
              {(availableTopics.length > 10 || DEFAULT_TOPICS.length > 10) && (
                <select
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={selectedTopic || ''}
                  onChange={(e) => setSelectedTopic(e.target.value || null)}
                >
                  <option value="">More...</option>
                  {(availableTopics.length > 0 ? availableTopics : DEFAULT_TOPICS).slice(10).map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
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
                No tests available
                {selectedYear || selectedTopic ? ' for ' : ''}
                {selectedYear ? `${selectedYear}` : ''}
                {selectedYear && selectedTopic ? ' / ' : ''}
                {selectedTopic ? `${selectedTopic}` : ''}
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{test.topic}</Badge>
                      {test.region && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {test.region}
                        </Badge>
                      )}
                      <Badge variant="outline">{test.year}</Badge>
                    </div>
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
