'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Download,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    questionsFound?: number;
    testId?: string;
    fromCache?: boolean;
  } | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message || `Successfully imported ${data.questionsFound} questions`,
          questionsFound: data.questionsFound,
          testId: data.test?.id,
          fromCache: data.fromCache,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to import test',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error - please check your connection',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = () => {
    if (result?.testId) {
      router.push('/');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Import Test from URL</h1>
          <p className="mt-2 text-gray-600">
            Paste a link to a Science Olympiad test PDF and we&apos;ll extract the questions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              PDF URL
            </CardTitle>
            <CardDescription>
              Enter the URL of a publicly accessible Science Olympiad test PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url" className="sr-only">PDF URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/test.pdf"
                  onKeyPress={(e) => e.key === 'Enter' && handleImport()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleImport}
                  disabled={!url.trim() || isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Processing PDF...</p>
                    <p className="text-sm text-blue-700">
                      Downloading and extracting questions using AI. This may take a moment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                      {result.success ? 'Import Successful!' : 'Import Failed'}
                    </p>
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>
                    {result.fromCache && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Loaded from cache (previously parsed)
                      </p>
                    )}
                    {result.success && (
                      <Button
                        onClick={handleStartTest}
                        className="mt-3 gap-2"
                        size="sm"
                      >
                        Go to Tests
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">How it works:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">1.</span>
                  <span>We download the PDF from the URL you provide</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">2.</span>
                  <span>AI extracts questions, answers, and metadata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">3.</span>
                  <span>The test is saved and ready to practice</span>
                </li>
              </ul>
            </div>

            {/* URL display */}
            {url && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <LinkIcon className="h-4 w-4" />
                <span className="truncate">{url}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
