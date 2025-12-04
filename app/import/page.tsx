'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, Link as LinkIcon, Loader2, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface ImportItem {
  url: string;
  title?: string;
  year?: number;
  topic?: string;
  region?: 'Invitational' | 'Regionals' | 'States' | 'Nationals';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  totalTime?: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  testId?: string;
}

const REGIONS = ['Invitational', 'Regionals', 'States', 'Nationals'] as const;

export default function ImportPage() {
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [metadata, setMetadata] = useState({
    title: '',
    year: new Date().getFullYear(),
    topic: '',
    region: '' as '' | 'Invitational' | 'Regionals' | 'States' | 'Nationals',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    totalTime: 3600,
  });

  const addSingleUrl = () => {
    if (!singleUrl.trim()) return;

    setImportItems([
      ...importItems,
      {
        url: singleUrl.trim(),
        ...metadata,
        title: metadata.title || undefined,
        region: metadata.region || undefined,
        status: 'pending',
      },
    ]);
    setSingleUrl('');
  };

  const addBulkUrls = () => {
    const urls = bulkUrls
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('http'));

    if (urls.length === 0) return;

    const newItems: ImportItem[] = urls.map((url) => ({
      url,
      status: 'pending',
    }));

    setImportItems([...importItems, ...newItems]);
    setBulkUrls('');
  };

  const removeItem = (index: number) => {
    setImportItems(importItems.filter((_, i) => i !== index));
  };

  const importAll = async () => {
    setIsImporting(true);
    setProgress(0);

    const pendingItems = importItems.filter((item) => item.status === 'pending');
    let completed = 0;

    for (let i = 0; i < importItems.length; i++) {
      const item = importItems[i];
      if (item.status !== 'pending') continue;

      // Update status to processing
      setImportItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: 'processing' } : it
        )
      );

      try {
        const response = await fetch('/api/download-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            metadata: {
              title: item.title,
              year: item.year,
              topic: item.topic,
              region: item.region,
              difficulty: item.difficulty,
              totalTime: item.totalTime,
            },
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setImportItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? { ...it, status: 'success', testId: result.test.id }
                : it
            )
          );
        } else {
          setImportItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? { ...it, status: 'error', error: result.error || 'Failed to import' }
                : it
            )
          );
        }
      } catch (error) {
        setImportItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? { ...it, status: 'error', error: 'Network error' }
              : it
          )
        );
      }

      completed++;
      setProgress((completed / pendingItems.length) * 100);

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsImporting(false);
  };

  const successCount = importItems.filter((i) => i.status === 'success').length;
  const errorCount = importItems.filter((i) => i.status === 'error').length;
  const pendingCount = importItems.filter((i) => i.status === 'pending').length;

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
          <h1 className="text-3xl font-bold text-gray-900">Import Tests from URLs</h1>
          <p className="mt-2 text-gray-600">
            Download and parse Science Olympiad test PDFs from URLs
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left sidebar - Add URLs */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Single URL */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Single URL</CardTitle>
                  <CardDescription>Import one test at a time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="url">PDF URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={singleUrl}
                      onChange={(e) => setSingleUrl(e.target.value)}
                      placeholder="https://example.com/test.pdf"
                      onKeyPress={(e) => e.key === 'Enter' && addSingleUrl()}
                    />
                  </div>

                  <div>
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={metadata.title}
                      onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                      placeholder="e.g., Biology Division C 2024"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={metadata.year}
                        onChange={(e) =>
                          setMetadata({ ...metadata, year: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="topic">Event/Topic</Label>
                      <Input
                        id="topic"
                        value={metadata.topic}
                        onChange={(e) => setMetadata({ ...metadata, topic: e.target.value })}
                        placeholder="Biology"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="region">Competition Level</Label>
                    <select
                      id="region"
                      value={metadata.region}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          region: e.target.value as '' | 'Invitational' | 'Regionals' | 'States' | 'Nationals',
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select Level</option>
                      {REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={metadata.difficulty}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <Button onClick={addSingleUrl} className="w-full gap-2" disabled={!singleUrl.trim()}>
                    <Plus className="h-4 w-4" />
                    Add to Queue
                  </Button>
                </CardContent>
              </Card>

              {/* Bulk URLs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Import</CardTitle>
                  <CardDescription>Add multiple URLs at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bulk">PDF URLs (one per line)</Label>
                    <Textarea
                      id="bulk"
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      placeholder="https://example.com/test1.pdf&#10;https://example.com/test2.pdf&#10;https://example.com/test3.pdf"
                      rows={8}
                    />
                  </div>
                  <Button onClick={addBulkUrls} variant="outline" className="w-full gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Add All to Queue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right side - Import queue */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Import Queue</CardTitle>
                    <CardDescription>
                      {importItems.length} items in queue
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={importAll}
                      disabled={isImporting || pendingCount === 0}
                      className="gap-2"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Import All ({pendingCount})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isImporting && (
                  <div className="mb-6">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} max={100} />
                  </div>
                )}

                {importItems.length > 0 && (
                  <div className="mb-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pendingCount} Pending</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{successCount} Success</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{errorCount} Failed</Badge>
                    </div>
                  </div>
                )}

                {importItems.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">No items in queue</p>
                    <p className="mt-2 text-sm">Add URLs using the form on the left</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {importItems.map((item, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-4 ${
                          item.status === 'success'
                            ? 'border-green-200 bg-green-50'
                            : item.status === 'error'
                            ? 'border-red-200 bg-red-50'
                            : item.status === 'processing'
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.status === 'success' && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {item.status === 'error' && (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              {item.status === 'processing' && (
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                              )}
                              <span className="font-medium text-sm">
                                {item.title || 'Untitled Test'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-600 truncate">{item.url}</p>
                            {item.error && (
                              <p className="mt-2 text-xs text-red-600">{item.error}</p>
                            )}
                            {(item.topic || item.year || item.region) && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.topic && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.topic}
                                  </Badge>
                                )}
                                {item.year && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.year}
                                  </Badge>
                                )}
                                {item.region && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.region}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {item.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
