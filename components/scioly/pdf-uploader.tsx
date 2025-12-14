'use client';

import React, { useState, useCallback } from 'react';
import { Question } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, AlertCircle, Eye, FileSearch } from 'lucide-react';

interface PDFUploaderProps {
  onQuestionsExtracted: (questions: Question[], rawText: string) => void;
}

type ParseMode = 'text' | 'vision';

export function PDFUploader({ onQuestionsExtracted }: PDFUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseMode, setParseMode] = useState<ParseMode>('text');

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

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Use different endpoint based on parse mode
    const endpoint = parseMode === 'vision' ? '/api/parse-pdf-vision' : '/api/parse-pdf';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse PDF');
      }

      if (result.success) {
        onQuestionsExtracted(result.questions, result.rawText);
      } else {
        throw new Error('PDF parsing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
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
