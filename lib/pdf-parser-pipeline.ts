// PDF Parser Pipeline - Downloads and parses Science Olympiad PDFs using GPT-4 Vision
// Extracts structured questions from real exam PDFs

import OpenAI from 'openai';
import { ReferenceQuestion } from './database';
import { normalizeTopic } from './topic-utils';

const MAX_PAGES = 20; // Limit pages to control API costs

// Types for the pipeline
export interface ParsedQuestion {
  questionText: string;
  questionType: 'multiple-choice' | 'short-answer' | 'calculation' | 'diagram';
  correctAnswer: string;
  options?: string[];
  explanation?: string;
  subtopic?: string;
}

export interface PDFParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  error?: string;
  pageCount?: number;
  totalPages?: number; // Total pages in PDF (may be > pageCount if truncated)
  truncated?: boolean; // True if PDF had more pages than MAX_PAGES
}

// Convert Google Drive share link to direct download link
export function convertGoogleDriveUrl(url: string): string | null {
  // Handle various Google Drive URL formats
  // Format 1: https://drive.google.com/file/d/FILE_ID/view
  // Format 2: https://drive.google.com/open?id=FILE_ID
  // Format 3: https://docs.google.com/document/d/FILE_ID/...

  let fileId: string | null = null;

  if (url.includes('/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    fileId = match?.[1] || null;
  } else if (url.includes('id=')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    fileId = match?.[1] || null;
  } else if (url.includes('/document/d/')) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    fileId = match?.[1] || null;
  }

  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return null;
}

// Convert Dropbox share link to direct download
export function convertDropboxUrl(url: string): string {
  // Change dl=0 to dl=1 for direct download
  return url.replace('dl=0', 'dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
}

// Get downloadable URL from various sources
export function getDownloadableUrl(url: string): string | null {
  // Handle relative URLs from scioly.org
  if (url.startsWith('/w/') || url.startsWith('/wiki/')) {
    return `https://scioly.org${url}`;
  }

  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    return convertGoogleDriveUrl(url);
  }

  if (url.includes('dropbox.com')) {
    return convertDropboxUrl(url);
  }

  // Direct PDF links
  if (url.endsWith('.pdf') || url.includes('.pdf?')) {
    return url;
  }

  // Full URLs to scioly.org
  if (url.includes('scioly.org')) {
    return url;
  }

  return null;
}

// Download PDF as base64
export async function downloadPDFAsBase64(url: string): Promise<{ success: boolean; data?: string; error?: string }> {
  const downloadUrl = getDownloadableUrl(url);

  if (!downloadUrl) {
    return { success: false, error: 'Could not convert URL to downloadable format' };
  }

  try {
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type') || '';

    // Check if we got HTML instead of PDF (common with Google Drive)
    if (contentType.includes('text/html')) {
      return { success: false, error: 'Received HTML instead of PDF - file may require authentication' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return { success: true, data: base64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Convert PDF buffer to page images using pdf-to-img
async function pdfToImages(pdfBuffer: Buffer): Promise<{
  images: string[];
  totalPages: number;
  truncated: boolean;
  error?: string;
}> {
  try {
    // Dynamic import for pdf-to-img (ESM module)
    const { pdf } = await import('pdf-to-img');

    const images: string[] = [];
    const document = await pdf(pdfBuffer, { scale: 1.5 });

    let totalPages = 0;
    for await (const image of document) {
      totalPages++;
      if (images.length < MAX_PAGES) {
        const base64 = Buffer.from(image).toString('base64');
        images.push(base64);
      }
      // Continue counting total pages even after we stop collecting images
    }

    return {
      images,
      totalPages,
      truncated: totalPages > MAX_PAGES,
    };
  } catch (error: any) {
    return { images: [], totalPages: 0, truncated: false, error: error.message };
  }
}

// Parse questions from PDF using GPT-4 Vision (multi-page support)
export async function parseQuestionsFromPDF(
  pdfBase64: string,
  topic: string,
  difficulty: string,
  openaiApiKey: string
): Promise<PDFParseResult> {
  // Convert base64 PDF to buffer, then to page images
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const { images, totalPages, truncated, error: conversionError } = await pdfToImages(pdfBuffer);

  if (conversionError || images.length === 0) {
    return {
      success: false,
      questions: [],
      error: conversionError || 'Could not extract pages from PDF',
      totalPages,
      truncated,
    };
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Build image content array for all pages
  const imageContents: OpenAI.ChatCompletionContentPart[] = images.map((base64) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:image/png;base64,${base64}`,
      detail: 'high' as const,
    },
  }));

  const systemPrompt = `You are an expert at extracting Science Olympiad test questions from exam PDFs.

CRITICAL: Analyze ALL ${images.length} page images and extract EVERY question you can find.

For each question, identify:
1. The question text (complete, including any context or data provided)
2. The question type: "multiple-choice", "short-answer", "calculation", or "diagram"
3. The correct answer (if visible - look for answer keys). If not visible, use empty string ""
4. For multiple choice: extract all options (A, B, C, D)
5. Any subtopic category if indicated

IMPORTANT:
- Extract EVERY question from ALL pages
- Preserve the exact wording of questions
- Include diagram descriptions in the question text
- If answer is not visible, use "" (empty string), NOT "See answer key"
- Tests typically have 20-50 questions

Return a JSON object:
{
  "questions": [
    {
      "questionText": "The complete question text",
      "questionType": "multiple-choice",
      "correctAnswer": "B) The correct option text",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "subtopic": "Optional subtopic category"
    }
  ],
  "totalQuestions": <number>
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This is a ${difficulty}-level Science Olympiad ${topic} exam with ${images.length} pages. Extract all questions. Return valid JSON only.`,
            },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 16000, // Increased for multi-page extraction
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return { success: false, questions: [], error: 'Empty response from API' };
    }

    const parsed = JSON.parse(content);
    const questions: ParsedQuestion[] = (parsed.questions || []).map((q: any) => ({
      questionText: q.questionText || q.question || '',
      questionType: normalizeQuestionType(q.questionType || q.type || 'short-answer'),
      correctAnswer: q.correctAnswer || q.answer || '',
      options: q.options,
      subtopic: q.subtopic,
    }));

    return {
      success: true,
      questions,
      pageCount: images.length,
      totalPages,
      truncated,
    };
  } catch (error: any) {
    return {
      success: false,
      questions: [],
      error: error.message,
      totalPages,
      truncated,
    };
  }
}

function normalizeQuestionType(type: string): 'multiple-choice' | 'short-answer' | 'calculation' | 'diagram' {
  const lower = type.toLowerCase();
  if (lower.includes('multiple') || lower.includes('choice') || lower === 'mc') {
    return 'multiple-choice';
  }
  if (lower.includes('calc')) {
    return 'calculation';
  }
  if (lower.includes('diagram')) {
    return 'diagram';
  }
  return 'short-answer';
}

// Convert parsed questions to ReferenceQuestion format
export function convertToReferenceQuestions(
  parsed: ParsedQuestion[],
  topic: string,
  difficulty: string,
  sourceUrl: string,
  sourceYear?: number,
  sourceTournament?: string
): ReferenceQuestion[] {
  const normalizedTopic = normalizeTopic(topic);

  return parsed.map((q) => ({
    topic: normalizedTopic,
    subtopic: q.subtopic,
    difficulty: difficulty as 'Invitational' | 'Regional' | 'State' | 'National',
    questionType: q.questionType,
    questionText: q.questionText,
    correctAnswer: q.correctAnswer,
    options: q.options,
    explanation: q.explanation,
    sourceYear,
    sourceTournament,
    sourceUrl,
    qualityScore: 7, // Default quality for parsed questions
    tags: [],
  }));
}

// Main pipeline function - process a single PDF
export async function processPDF(
  url: string,
  topic: string,
  difficulty: string,
  openaiApiKey: string,
  sourceYear?: number,
  sourceTournament?: string
): Promise<{
  success: boolean;
  questions: ReferenceQuestion[];
  error?: string;
  pageCount?: number;
  totalPages?: number;
  truncated?: boolean;
}> {
  // Step 1: Download PDF
  const downloadResult = await downloadPDFAsBase64(url);

  if (!downloadResult.success || !downloadResult.data) {
    return {
      success: false,
      questions: [],
      error: `Download failed: ${downloadResult.error}`,
    };
  }

  // Step 2: Parse with GPT-4 Vision
  const parseResult = await parseQuestionsFromPDF(
    downloadResult.data,
    topic,
    difficulty,
    openaiApiKey
  );

  if (!parseResult.success) {
    return {
      success: false,
      questions: [],
      error: `Parse failed: ${parseResult.error}`,
      pageCount: parseResult.pageCount,
      totalPages: parseResult.totalPages,
      truncated: parseResult.truncated,
    };
  }

  // Step 3: Convert to ReferenceQuestion format
  const referenceQuestions = convertToReferenceQuestions(
    parseResult.questions,
    topic,
    difficulty,
    url,
    sourceYear,
    sourceTournament
  );

  return {
    success: true,
    questions: referenceQuestions,
    pageCount: parseResult.pageCount,
    totalPages: parseResult.totalPages,
    truncated: parseResult.truncated,
  };
}
