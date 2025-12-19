'use client';

import React, { useState, useCallback } from 'react';
import { Question } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface TestInfo {
  title: string | null;
  topic: string | null;
  year: number | null;
  difficulty: string;
}

interface PDFUploaderProps {
  onQuestionsExtracted: (questions: Question[], rawText: string, testInfo?: TestInfo, fileName?: string) => void;
}

export function PDFUploader({ onQuestionsExtracted }: PDFUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsParsing(true);
    setError(null);
    setErrorDetails(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const endpoint = '/api/parse-pdf';

    console.log(`[PDF Upload] Starting upload to ${endpoint}`, {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type
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
        onQuestionsExtracted(result.questions, result.rawText || '', result.testInfo, selectedFile?.name);
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
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isParsing}
          className="mt-6 w-full"
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing PDF...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Parse PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
