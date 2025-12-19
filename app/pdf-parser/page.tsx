'use client';

import React, { useState } from 'react';
import { Question, Test, Difficulty } from '@/lib/types';
import { PDFUploader } from '@/components/scioly/pdf-uploader';
import { TestViewer } from '@/components/scioly/test-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateId } from '@/lib/utils';
import { ArrowLeft, Save, FileText, Edit3, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PDFParserPage() {
  const router = useRouter();
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [rawText, setRawText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [testMetadata, setTestMetadata] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    topic: '',
    difficulty: 'Regional' as Difficulty,
    totalTime: 3600, // 1 hour default
  });
  const [showRawText, setShowRawText] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleQuestionsExtracted = (questions: Question[], text: string, testInfo?: {
    title: string | null;
    topic: string | null;
    year: number | null;
    difficulty: string;
  }, fileName?: string) => {
    setParsedQuestions(questions);
    setRawText(text);

    // Generate title from filename if no title from AI
    const generateTitleFromFileName = (name: string): string => {
      // Remove .pdf extension and replace underscores/hyphens with spaces
      return name
        .replace(/\.pdf$/i, '')
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const autoTitle = testInfo?.title || (fileName ? generateTitleFromFileName(fileName) : '');
    const autoTopic = testInfo?.topic || '';

    setTestMetadata(prev => ({
      ...prev,
      title: autoTitle || prev.title,
      topic: autoTopic || prev.topic,
      year: testInfo?.year || prev.year,
      difficulty: (testInfo?.difficulty as Difficulty) || prev.difficulty,
      description: autoTitle ? `Parsed from uploaded PDF` : prev.description,
    }));
  };

  const handleQuestionEdit = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...parsedQuestions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setParsedQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setParsedQuestions(parsedQuestions.filter((_, i) => i !== index));
    }
  };

  const handleSaveToLibrary = async () => {
    if (!testMetadata.title) {
      alert('Please enter a test title');
      return;
    }

    const totalPoints = parsedQuestions.reduce((sum, q) => sum + q.points, 0);

    const test: Test = {
      id: generateId(),
      title: testMetadata.title,
      description: testMetadata.description,
      year: testMetadata.year,
      topic: testMetadata.topic,
      difficulty: testMetadata.difficulty,
      totalTime: testMetadata.totalTime,
      questions: parsedQuestions,
      totalPoints,
    };

    // Save to database via API
    try {
      const response = await fetch('/api/save-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Test saved to library!');
        window.location.href = '/';
      } else {
        alert('Failed to save test: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test. Please try again.');
    }
  };

  // Create a test object for preview
  const createPreviewTest = (): Test => {
    const totalPoints = parsedQuestions.reduce((sum, q) => sum + q.points, 0);
    return {
      id: 'preview-' + generateId(),
      title: testMetadata.title || 'Untitled Test',
      description: testMetadata.description,
      year: testMetadata.year,
      topic: testMetadata.topic || 'General',
      difficulty: testMetadata.difficulty,
      totalTime: testMetadata.totalTime,
      questions: parsedQuestions,
      totalPoints,
    };
  };

  const handlePreviewTest = () => {
    if (parsedQuestions.length === 0) {
      alert('No questions to preview');
      return;
    }
    setIsPreviewMode(true);
  };

  const handleExitPreview = () => {
    setIsPreviewMode(false);
  };

  const handleGenerateInspiredTest = () => {
    // Store the parsed test info in sessionStorage for the AI generator to use
    const inspiredTestData = {
      topic: testMetadata.topic,
      title: testMetadata.title,
      questionCount: parsedQuestions.length,
      sampleQuestions: parsedQuestions.slice(0, 5).map(q => q.question), // Sample for inspiration
    };
    sessionStorage.setItem('inspiredTestData', JSON.stringify(inspiredTestData));
    router.push('/?tab=ai-generate&inspired=true');
  };

  // Preview mode - show TestViewer
  if (isPreviewMode && parsedQuestions.length > 0) {
    return (
      <TestViewer
        test={createPreviewTest()}
        onSubmit={() => setIsPreviewMode(false)}
        onBack={handleExitPreview}
      />
    );
  }

  if (parsedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">PDF Parser</h1>
            <p className="mt-2 text-gray-600">
              Upload a Science Olympiad test PDF to automatically extract questions
            </p>
          </div>

          <PDFUploader onQuestionsExtracted={handleQuestionsExtracted} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Review Parsed Questions</h1>
          <p className="mt-2 text-gray-600">
            Review and edit the extracted questions before saving to your library
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar - Test Metadata */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Test Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    value={testMetadata.title}
                    onChange={(e) =>
                      setTestMetadata({ ...testMetadata, title: e.target.value })
                    }
                    placeholder="e.g., Biology Division C 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={testMetadata.description}
                    onChange={(e) =>
                      setTestMetadata({ ...testMetadata, description: e.target.value })
                    }
                    placeholder="Brief description of the test"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={testMetadata.year}
                    onChange={(e) =>
                      setTestMetadata({ ...testMetadata, year: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="topic">Event/Topic</Label>
                  <Input
                    id="topic"
                    value={testMetadata.topic}
                    onChange={(e) =>
                      setTestMetadata({ ...testMetadata, topic: e.target.value })
                    }
                    placeholder="e.g., Biology, Chemistry"
                  />
                </div>

                <div>
                  <Label htmlFor="totalTime">Total Time (minutes)</Label>
                  <Input
                    id="totalTime"
                    type="number"
                    value={testMetadata.totalTime / 60}
                    onChange={(e) =>
                      setTestMetadata({
                        ...testMetadata,
                        totalTime: parseInt(e.target.value) * 60,
                      })
                    }
                  />
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Questions:</span>
                    <Badge>{parsedQuestions.length}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>Total Points:</span>
                    <Badge>
                      {parsedQuestions.reduce((sum, q) => sum + q.points, 0)}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handlePreviewTest}
                  variant="secondary"
                  className="w-full gap-2"
                >
                  <Play className="h-4 w-4" />
                  Preview Test
                </Button>

                <Button onClick={handleSaveToLibrary} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save to Library
                </Button>

                <Button
                  onClick={handleGenerateInspiredTest}
                  variant="outline"
                  className="w-full gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Inspired Test
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full gap-2 text-gray-500"
                  size="sm"
                >
                  <FileText className="h-4 w-4" />
                  {showRawText ? 'Hide' : 'Show'} Raw Text
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Questions */}
          <div className="lg:col-span-2">
            {showRawText && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Raw Extracted Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={rawText}
                    readOnly
                    rows={10}
                    className="font-mono text-xs"
                  />
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {parsedQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingIndex(editingIndex === index ? null : index)
                          }
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingIndex === index ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Question Text</Label>
                          <Textarea
                            value={question.question}
                            onChange={(e) =>
                              handleQuestionEdit(index, 'question', e.target.value)
                            }
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={question.points}
                              onChange={(e) =>
                                handleQuestionEdit(
                                  index,
                                  'points',
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Input
                              value={question.category}
                              onChange={(e) =>
                                handleQuestionEdit(index, 'category', e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Correct Answer</Label>
                          <Input
                            value={question.correctAnswer}
                            onChange={(e) =>
                              handleQuestionEdit(index, 'correctAnswer', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-base">{question.question}</p>
                        {question.options && (
                          <div className="mt-3 space-y-1">
                            {question.options.map((opt, i) => (
                              <div key={i} className="text-sm text-gray-600">
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
