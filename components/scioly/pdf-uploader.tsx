'use client';

import React, { useState, useCallback } from 'react';
import { Question } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, AlertCircle, Eye, FileSearch } from 'lucide-react';

interface TestInfo {
  title: string | null;
  topic: string | null;
  year: number | null;
  difficulty: string;
}

interface PDFUploaderProps {
  onQuestionsExtracted: (questions: Question[], rawText: string, testInfo?: TestInfo) => void;
}

type ParseMode = 'text' | 'vision';

export function PDFUploader({ onQuestionsExtracted }: PDFUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [parseMode, setParseMode] = useState<ParseMode>('text');
  const [suggestVision, setSuggestVision] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        setError('Please upload a PDF file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleUpload = async (useVision = false) => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsParsing(true);
    setError(null);
    setErrorDetails(null);
    setSuggestVision(false);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Use different endpoint based on parse mode or override
    const mode = useVision ? 'vision' : parseMode;
    const endpoint = mode === 'vision' ? '/api/parse-pdf-vision' : '/api/parse-pdf';

    console.log(`[PDF Upload] Starting upload to ${endpoint}`, {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      mode
    });

    try {
      const startTime = Date.now();
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const responseTime = Date.now() - startTime;
      console.log(`[PDF Upload] Response received`, {
        status: response.status,
        statusText: response.statusText,
        responseTimeMs: responseTime
      });

      // Handle non-JSON responses (like 502 Bad Gateway)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textBody = await response.text();
        console.error(`[PDF Upload] Non-JSON response:`, {
          status: response.status,
          contentType,
          body: textBody.substring(0, 500)
        });
        setError(`Server error (${response.status}): ${response.statusText}`);
        setErrorDetails(`The server returned a non-JSON response. This usually means the function crashed or timed out. Status: ${response.status}`);
        setIsParsing(false);
        return;
      }

      const result = await response.json();
      console.log(`[PDF Upload] Parsed response:`, {
        success: result.success,
        error: result.error,
        step: result.step,
        details: result.details
      });

      // Check if API suggests using vision mode (scanned PDF detected)
      if (response.status === 422 && result.suggestVision) {
        setSuggestVision(true);
        setError('This appears to be a scanned PDF. Text extraction found very little content.');
        setErrorDetails(`Extracted only ${result.extractedChars} characters from ${result.pages} pages.`);
        setIsParsing(false);
        return;
      }

      if (!response.ok) {
        setError(result.error || 'Failed to parse PDF');
        setErrorDetails(result.details ? `${result.details}${result.step ? ` (Step: ${result.step})` : ''}` : null);
        setIsParsing(false);
        return;
      }

      if (result.success) {
        console.log(`[PDF Upload] Success!`, {
          questionsCount: result.questions?.length,
          pages: result.pages,
          processingTime: result.metadata?.processingTimeMs,
          testInfo: result.testInfo
        });
        onQuestionsExtracted(result.questions, result.rawText || '', result.testInfo);
      } else {
        setError('PDF parsing failed');
        setErrorDetails('The server did not return a success response.');
      }
    } catch (err) {
      console.error(`[PDF Upload] Fetch error:`, err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error - could not reach the server');
        setErrorDetails('Check your internet connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setErrorDetails(err instanceof Error ? (err.stack?.split('\n')[0] || null) : null);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleRetryWithVision = () => {
    setParseMode('vision');
    handleUpload(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Science Olympiad Test PDF</CardTitle>
        <CardDescription>
          Upload a PDF file containing Science Olympiad test questions. The app will
          automatically extract and parse the questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm font-medium text-gray-900">
            {selectedFile ? selectedFile.name : 'Drag and drop your PDF here'}
          </p>
          <p className="mt-1 text-sm text-gray-500">or click to browse</p>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        {selectedFile && (
          <div className="mt-4 flex items-center gap-3 rounded-md bg-blue-50 p-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
              <p className="text-xs text-blue-700">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {/* Parse Mode Toggle */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Parsing Method</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setParseMode('text')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                parseMode === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileSearch className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Text Extract</div>
                <div className="text-xs opacity-75">Fast, digital PDFs</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setParseMode('vision')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                parseMode === 'vision'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eye className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Vision AI</div>
                <div className="text-xs opacity-75">Scanned/image PDFs</div>
              </div>
            </button>
          </div>
          {parseMode === 'vision' && (
            <p className="mt-2 text-xs text-amber-600">
              Vision mode uses GPT-4o to read images. More accurate but slower and uses more API credits.
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                {errorDetails && (
                  <p className="mt-1 text-xs text-red-600">{errorDetails}</p>
                )}
              </div>
            </div>
            {suggestVision && (
              <Button
                onClick={handleRetryWithVision}
                variant="outline"
                size="sm"
                className="mt-3 w-full border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
              >
                <Eye className="mr-2 h-4 w-4" />
                Retry with Vision AI
              </Button>
            )}
          </div>
        )}

        <Button
          onClick={() => handleUpload()}
          disabled={!selectedFile || isParsing}
          className="mt-6 w-full"
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {parseMode === 'vision' ? 'Scanning pages with Vision AI...' : 'Parsing PDF...'}
            </>
          ) : (
            <>
              {parseMode === 'vision' ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {parseMode === 'vision' ? 'Scan with Vision AI' : 'Parse PDF'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
