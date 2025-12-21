'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Test, UserAnswer, ViewType } from '@/lib/types';
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
  Target,
  Sparkles,
  Trophy,
  Download,
  RefreshCw,
  ExternalLink,
  FolderOpen,
  Beaker,
  Loader2,
  MapPin,
  History,
  FileText,
  AlertCircle,
  Eye,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { HorizontalAd } from '@/components/adsense';

// Static options for when database is empty
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
  'Machines',
  'Microbe Mission',
  'Optics',
  'Ornithology',
  'Reach for the Stars',
  'Rocks and Minerals',
  'Tower',
  'Wind Power',
  'Write It Do It',
];

// Test result with test info for history display
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

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('browse');
  const [tests, setTests] = useState<Test[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<TestResultWithTest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState({
    topic: '',
    questionCount: 10,
    difficulty: 'Regional' as 'Invitational' | 'Regional' | 'State' | 'National',
  });

  // PDF-inspired generation state
  interface PDFSourceInfo {
    id: string;
    name: string;
    topic: string;
    year: number;
    level: string;
    source: string;
    sourceUrl: string;
    description: string;
  }
  const [pdfSources, setPdfSources] = useState<PDFSourceInfo[]>([]);
  const [selectedPdfSource, setSelectedPdfSource] = useState<string>('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfQuestionCount, setPdfQuestionCount] = useState(20);

  // Load tests from database on mount
  useEffect(() => {
    loadTests();
    loadTopics();
    loadPdfSources();
  }, []);

  // Load history when user is logged in
  useEffect(() => {
    if (session?.user) {
      loadHistory();
    }
  }, [session]);

  // Reload when topic changes
  useEffect(() => {
    loadTests(selectedTopic ?? undefined);
  }, [selectedTopic]);

  // Reset view when navigating to home via header link
  useEffect(() => {
    if (pathname === '/') {
      setCurrentView('browse');
      setSelectedTest(null);
      setUserAnswers([]);
      setTimeSpent(0);
    }
  }, [pathname]);

  // Listen for custom event from HomeNavLink to reset view
  useEffect(() => {
    const handleResetHomeView = () => {
      setCurrentView('browse');
      setSelectedTest(null);
      setUserAnswers([]);
      setTimeSpent(0);
    };

    window.addEventListener('reset-home-view', handleResetHomeView);
    return () => {
      window.removeEventListener('reset-home-view', handleResetHomeView);
    };
  }, []);

  // Handle inspired test from PDF parser
  useEffect(() => {
    const isInspired = searchParams.get('inspired') === 'true';
    if (isInspired) {
      try {
        const inspiredData = sessionStorage.getItem('inspiredTestData');
        if (inspiredData) {
          const data = JSON.parse(inspiredData);
          // Pre-fill the AI generator with the topic
          if (data.topic) {
            setGenConfig(prev => ({
              ...prev,
              topic: data.topic,
              questionCount: data.questionCount || 20,
            }));
          }
          // Clear the session storage after reading
          sessionStorage.removeItem('inspiredTestData');
          // Clear the URL parameter
          router.replace('/');
          // Scroll to the AI generator section
          setTimeout(() => {
            const aiSection = document.getElementById('ai-generator');
            if (aiSection) {
              aiSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      } catch (e) {
        console.error('Failed to parse inspired test data:', e);
      }
    }
  }, [searchParams, router]);

  const loadTests = async (topic?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
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

  const loadPdfSources = async () => {
    try {
      const response = await fetch('/api/generate-from-pdf');
      const data = await response.json();
      setPdfSources(data.sources || []);
    } catch (error) {
      console.error('Error loading PDF sources:', error);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setTestHistory(data.results || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper functions for history display
  const formatHistoryTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHistoryDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGradeColor = (pct: number): string => {
    if (pct >= 90) return 'bg-green-100 text-green-800';
    if (pct >= 80) return 'bg-blue-100 text-blue-800';
    if (pct >= 70) return 'bg-yellow-100 text-yellow-800';
    if (pct >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getGrade = (pct: number): string => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  // Get the latest result for a specific test
  const getLatestResultForTest = (testId: string): TestResultWithTest | undefined => {
    return testHistory.find(r => r.testId === testId);
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
    // Reset state to go back to browse view
    setCurrentView('browse');
    setSelectedTest(null);
    setUserAnswers([]);
    setTimeSpent(0);
  };

  // Check auth and redirect to signin or destination
  const handleProtectedNavigation = (destination: string) => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }
    router.push(destination);
  };

  const handleGenerateTest = async () => {
    // Require login to generate tests
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    if (!genConfig.topic) {
      alert('Please select a Topic to generate a test.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genConfig.topic,
          questionCount: genConfig.questionCount,
          difficulty: genConfig.difficulty,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Reload tests and start the generated test
        await loadTests();
        await loadTopics();
        handleStartTest(result.test);
      } else {
        alert(result.error || 'Failed to generate test. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate test:', error);
      alert('Failed to generate test. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromPdf = async () => {
    // Require login
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    if (!selectedPdfSource) {
      alert('Please select an exam structure to inspire your test.');
      return;
    }

    setIsPdfGenerating(true);
    try {
      const response = await fetch('/api/generate-from-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedPdfSource,
          questionCount: pdfQuestionCount,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await loadTests();
        await loadTopics();
        handleStartTest(result.test);
      } else {
        alert(result.error || 'Failed to generate test. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate from PDF:', error);
      alert('Failed to generate test. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Get selected source info for display
  const selectedSourceInfo = pdfSources.find(s => s.id === selectedPdfSource);

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
            {session?.user && (
              <Link href="/history">
                <Button size="lg" variant="secondary" className="gap-2">
                  <History className="h-5 w-5" />
                  Test History
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Practice Tests</h2>
        </div>

        {/* AI Test Generator Section */}
        <Card id="ai-generator" className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <CardTitle>AI Test Generator</CardTitle>
            </div>
            <CardDescription>
              Generate 100% original practice questions using AI. Choose any Science Olympiad topic and difficulty level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Topic */}
              <div>
                <Label htmlFor="gen-topic" className="text-sm">Topic <span className="text-red-500">*</span></Label>
                <select
                  id="gen-topic"
                  value={genConfig.topic}
                  onChange={(e) => setGenConfig({ ...genConfig, topic: e.target.value })}
                  className={`mt-1 flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ${!genConfig.topic ? 'border-gray-300' : 'border-purple-400'}`}
                >
                  <option value="">Select Topic...</option>
                  {DEFAULT_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <Label htmlFor="gen-difficulty" className="text-sm">Difficulty</Label>
                <select
                  id="gen-difficulty"
                  value={genConfig.difficulty}
                  onChange={(e) => setGenConfig({ ...genConfig, difficulty: e.target.value as 'Invitational' | 'Regional' | 'State' | 'National' })}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Invitational">Invitational</option>
                  <option value="Regional">Regional</option>
                  <option value="State">State</option>
                  <option value="National">National</option>
                </select>
              </div>

              {/* Question Count */}
              <div>
                <Label htmlFor="gen-count" className="text-sm">Questions (max 10)</Label>
                <Input
                  id="gen-count"
                  type="number"
                  min="5"
                  max="10"
                  value={genConfig.questionCount}
                  onChange={(e) => setGenConfig({ ...genConfig, questionCount: Math.min(parseInt(e.target.value) || 10, 10) })}
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

            {genConfig.topic && (
              <p className="mt-3 text-sm text-purple-700">
                Will generate {genConfig.questionCount} {genConfig.difficulty.toLowerCase()} questions for {genConfig.topic}
              </p>
            )}
          </CardContent>
        </Card>

        {/* PDF-Inspired Test Generator */}
        {pdfSources.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <CardTitle>Exam-Inspired Generator</CardTitle>
              </div>
              <CardDescription>
                Generate original questions based on real Science Olympiad exam structures. We analyze format, topic distribution, and difficulty - then create 100% NEW questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Important Notice */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>How it works:</strong> We do NOT copy, reproduce, or show any actual exam questions.
                  Instead, we analyze the exam&apos;s structure (topics covered, question types, difficulty level)
                  and generate entirely original questions that follow a similar format.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Exam Source Selection */}
                <div className="lg:col-span-2">
                  <Label htmlFor="pdf-source" className="text-sm">Select Exam Structure <span className="text-red-500">*</span></Label>
                  <select
                    id="pdf-source"
                    value={selectedPdfSource}
                    onChange={(e) => setSelectedPdfSource(e.target.value)}
                    className={`mt-1 flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ${!selectedPdfSource ? 'border-gray-300' : 'border-blue-400'}`}
                  >
                    <option value="">Choose an exam structure...</option>
                    {pdfSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name} ({source.level})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Count */}
                <div>
                  <Label htmlFor="pdf-count" className="text-sm">Questions</Label>
                  <Input
                    id="pdf-count"
                    type="number"
                    min="5"
                    max="50"
                    value={pdfQuestionCount}
                    onChange={(e) => setPdfQuestionCount(parseInt(e.target.value) || 20)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Selected Source Info */}
              {selectedSourceInfo && (
                <div className="mt-4 p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-900">
                    <strong>Topic:</strong> {selectedSourceInfo.topic} |
                    <strong> Level:</strong> {selectedSourceInfo.level} |
                    <strong> Year:</strong> {selectedSourceInfo.year}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">{selectedSourceInfo.description}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    <strong>Source:</strong> {selectedSourceInfo.source} —{' '}
                    <a
                      href={selectedSourceInfo.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-800"
                    >
                      Browse Test Exchange ↗
                    </a>
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <div className="mt-4">
                <Button
                  onClick={handleGenerateFromPdf}
                  disabled={isPdfGenerating || !selectedPdfSource}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isPdfGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing structure & generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate Original Test
                    </>
                  )}
                </Button>
              </div>

              {/* Transparency & Disclaimer */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">What we store vs. don&apos;t store:</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  <li>✓ We store: Only AI-generated original questions (cached to reduce costs)</li>
                  <li>✗ We do NOT store: Any PDF files or original exam content</li>
                  <li>→ Links above point to third-party sites where exams are publicly shared</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload PDF and Import URL */}
        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          {/* Upload PDF */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Upload className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">Upload Your PDF</CardTitle>
              </div>
              <CardDescription>
                Have your own test PDFs? Upload them and we&apos;ll parse the questions automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-green-800 space-y-1 mb-4">
                <li>• Extracts questions from PDF files</li>
                <li>• Supports multiple choice & short answer</li>
                <li>• Review and edit before saving</li>
              </ul>
              <Button
                onClick={() => handleProtectedNavigation('/pdf-parser')}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4" />
                Upload PDF Test
              </Button>
            </CardContent>
          </Card>

          {/* Import from URL */}
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Download className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-lg">Import from URL</CardTitle>
              </div>
              <CardDescription>
                Paste a PDF link and AI will extract all the questions for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-orange-800 space-y-1 mb-4">
                <li>• Supports direct PDF links</li>
                <li>• <strong>Google Drive links supported!</strong></li>
                <li>• AI parses questions automatically</li>
              </ul>
              <Button
                onClick={() => handleProtectedNavigation('/import')}
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Download className="h-4 w-4" />
                Import from URL
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Exchange Archive Link */}
        <a
          href="https://scioly.org/wiki/Test_Exchange_Archive"
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-8"
        >
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Science Olympiad Test Exchange Archive</h3>
                  <p className="text-sm text-amber-700">
                    Browse hundreds of real tests from invitationals, regionals, and states on scioly.org
                  </p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-amber-600 flex-shrink-0" />
            </CardContent>
          </Card>
        </a>

        {/* Ad after generators */}
        {process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT_1 && (
          <HorizontalAd adSlot={process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT_1} className="mb-8" />
        )}

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

        {/* Browse Tests History Section */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Browse Tests History</h2>
            </div>
            {selectedTopic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTopic(null)}
              >
                Clear Filter
              </Button>
            )}
          </div>
          <p className="text-gray-600">View your test results or retake any test</p>

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

        {/* Test Grid with History */}
        {isLoading || isLoadingHistory ? (
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
                No tests available{selectedTopic ? ` for ${selectedTopic}` : ''}
              </p>
              <p className="mt-2 text-gray-600">
                Get started by generating tests or importing from URLs
              </p>
              <div className="mt-6 flex gap-3 justify-center flex-wrap">
                <Button
                  className="gap-2"
                  onClick={() => handleProtectedNavigation('/import')}
                >
                  <Download className="h-4 w-4" />
                  Import from URL
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleProtectedNavigation('/pdf-parser')}
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => {
              const lastResult = getLatestResultForTest(test.id);
              return (
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

                    {/* Last Result Display */}
                    {lastResult && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Last Result</span>
                          <Badge className={getGradeColor(lastResult.percentage)}>
                            {getGrade(lastResult.percentage)} ({lastResult.percentage}%)
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {lastResult.score}/{lastResult.totalPoints} pts
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatHistoryTime(lastResult.timeSpent)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatHistoryDate(lastResult.completedAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => handleStartTest(test)}
                        className="flex-1 gap-2"
                        variant={lastResult ? 'outline' : 'default'}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {lastResult ? 'Retake' : 'Start Test'}
                      </Button>
                      {lastResult && (
                        <Link href="/history" className="flex-1">
                          <Button variant="secondary" className="w-full gap-2">
                            <Eye className="h-4 w-4" />
                            View History
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Ad before footer */}
        {process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT_2 && (
          <HorizontalAd adSlot={process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT_2} className="mt-8" />
        )}
      </div>
    </div>
  );
}
