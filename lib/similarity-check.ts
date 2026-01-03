// Similarity checking utilities to ensure generated content is original
// This provides a safety layer to reject outputs that may be too similar to source material

export interface SimilarityResult {
  isSafe: boolean;
  score: number;
  flaggedPhrases: string[];
  recommendation: string;
}

// Common Science Olympiad question patterns that should be generated freshly
const GENERIC_PATTERNS = [
  'which of the following',
  'what is the',
  'calculate the',
  'identify the',
  'describe the',
  'explain how',
  'compare and contrast',
];

// Tokenize text into words
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Calculate Jaccard similarity between two sets of tokens
function jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const unionArr = Array.from(set1).concat(Array.from(set2));
  const union = new Set(unionArr);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Extract n-grams from text
function extractNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// Check for suspicious phrase overlaps
// Note: We only flag multi-word phrases, not single topic keywords
// Single words like "epidemiology" or "transmission" are expected in topic-relevant questions
function findSuspiciousPhrases(
  generatedText: string,
  sourceKeywords: string[]
): string[] {
  const flagged: string[] = [];
  const lowerGenerated = generatedText.toLowerCase();

  // Check for exact multi-word phrase matches that suggest copying
  // Single words are allowed since they're just topic terms
  for (const keyword of sourceKeywords) {
    // Only flag multi-word phrases (contains a space) that are long enough
    if (keyword.includes(' ') && keyword.length > 15 && lowerGenerated.includes(keyword.toLowerCase())) {
      flagged.push(keyword);
    }
  }

  return flagged;
}

// Main similarity check function
export function checkSimilarity(
  generatedQuestions: string[],
  sourceMetaKeywords: string[] = [],
  threshold: number = 0.3
): SimilarityResult {
  const allGeneratedText = generatedQuestions.join(' ');
  const generatedTokens = tokenize(allGeneratedText);

  // Check against source keywords if provided
  let keywordOverlapScore = 0;
  if (sourceMetaKeywords.length > 0) {
    const sourceTokens = sourceMetaKeywords.flatMap(k => tokenize(k));
    keywordOverlapScore = jaccardSimilarity(generatedTokens, sourceTokens);
  }

  // Find any suspicious exact phrases
  const flaggedPhrases = findSuspiciousPhrases(allGeneratedText, sourceMetaKeywords);

  // Check for repetitive patterns within generated content
  const trigrams = extractNgrams(generatedTokens, 3);
  const uniqueTrigrams = new Set(trigrams);
  const repetitionRatio = trigrams.length > 0
    ? uniqueTrigrams.size / trigrams.length
    : 1;

  // Calculate overall safety score
  const overallScore = keywordOverlapScore * 0.7 + (1 - repetitionRatio) * 0.3;

  const isSafe = overallScore < threshold && flaggedPhrases.length === 0;

  let recommendation = '';
  if (!isSafe) {
    if (flaggedPhrases.length > 0) {
      recommendation = `Found ${flaggedPhrases.length} potentially copied phrases. Regenerate with more original content.`;
    } else if (overallScore >= threshold) {
      recommendation = `Similarity score (${(overallScore * 100).toFixed(1)}%) exceeds threshold. Content may be too similar to source material.`;
    }
  } else {
    recommendation = 'Content appears sufficiently original.';
  }

  return {
    isSafe,
    score: overallScore,
    flaggedPhrases,
    recommendation,
  };
}

// Validate that generated content doesn't contain specific disallowed patterns
export function validateOriginalContent(questions: { question: string; correctAnswer: string }[]): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Check for placeholder or template-like content
    if (q.question.includes('[') && q.question.includes(']')) {
      issues.push(`Question ${i + 1}: Contains bracket placeholders - may be incomplete`);
    }

    // Check for suspiciously short questions
    if (q.question.length < 20) {
      issues.push(`Question ${i + 1}: Question too short - may lack detail`);
    }

    // Check for missing question marks
    if (!q.question.includes('?') && !q.question.toLowerCase().startsWith('calculate') &&
        !q.question.toLowerCase().startsWith('identify') && !q.question.toLowerCase().startsWith('name')) {
      issues.push(`Question ${i + 1}: May not be properly formatted as a question`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Extract safe keywords from content for meta-analysis (non-copyrightable elements)
export function extractSafeMetaKeywords(text: string): string[] {
  const tokens = tokenize(text);

  // Scientific terms and topics (not copyrightable)
  const scientificTerms = tokens.filter(token => {
    // Filter for likely scientific/technical terms
    return token.length > 5 && !GENERIC_PATTERNS.some(p => p.includes(token));
  });

  // Return unique terms, limited to prevent over-matching
  return Array.from(new Set(scientificTerms)).slice(0, 50);
}

// ============================================================================
// Question Validation and Repair Utilities
// ============================================================================

export type ValidQuestionType = 'multiple-choice' | 'short-answer' | 'calculation' | 'diagram';

// Normalize question type to match database enum
export function normalizeQuestionType(type: string): ValidQuestionType {
  const normalized = type.toLowerCase().trim();

  // Map variations to canonical types
  const typeMap: Record<string, ValidQuestionType> = {
    'multiple-choice': 'multiple-choice',
    'multiplechoice': 'multiple-choice',
    'mc': 'multiple-choice',
    'multiple choice': 'multiple-choice',
    'short-answer': 'short-answer',
    'shortanswer': 'short-answer',
    'short answer': 'short-answer',
    'sa': 'short-answer',
    'calculation': 'calculation',
    'calc': 'calculation',
    'diagram': 'diagram',
    'diagram-analysis': 'diagram', // Key normalization
    'diagramanalysis': 'diagram',
    'diagram analysis': 'diagram',
  };

  return typeMap[normalized] || 'short-answer';
}

// Strip ALL option prefixes (handles double prefixes like "A. a. Nitrogen")
function stripAllPrefixes(text: string): string {
  let result = text.trim();
  let prev = '';
  // Loop until no more prefixes are stripped
  while (result !== prev) {
    prev = result;
    result = result
      .replace(/^\(?[A-Da-d][).:\]]\)?\s*/, '') // Handles A) A. A: (A) [A]
      .replace(/^\d+[).:\]]\s*/, '')            // Handles 1) 1. 1: for numbered options
      .trim();
  }
  return result;
}

// Validate MC question has correctAnswer in options
export function validateMultipleChoice(question: {
  type: string;
  options?: string[];
  correctAnswer: string;
}): { isValid: boolean; repairedAnswer?: string; issue?: string } {
  if (question.type !== 'multiple-choice') {
    return { isValid: true };
  }

  if (!question.options || question.options.length === 0) {
    return { isValid: false, issue: 'Multiple choice question has no options' };
  }

  const correctAnswer = question.correctAnswer.trim();

  // Check exact match first
  if (question.options.includes(correctAnswer)) {
    return { isValid: true };
  }

  // Strip ALL prefixes from answer (handles "A. a. Nitrogen" etc.)
  const answerWithoutPrefix = stripAllPrefixes(correctAnswer);

  // Try to find a match by comparing stripped content
  for (const option of question.options) {
    const optionContent = stripAllPrefixes(option);
    if (optionContent.toLowerCase() === answerWithoutPrefix.toLowerCase()) {
      return { isValid: true, repairedAnswer: option };
    }
  }

  // Try partial match (answer contained in option or vice versa)
  for (const option of question.options) {
    const optionContent = stripAllPrefixes(option).toLowerCase();
    const answerContent = answerWithoutPrefix.toLowerCase();
    if (optionContent.includes(answerContent) || answerContent.includes(optionContent)) {
      // Only repair if it's a close enough match (at least 80% overlap)
      const minLen = Math.min(optionContent.length, answerContent.length);
      const maxLen = Math.max(optionContent.length, answerContent.length);
      if (minLen / maxLen > 0.8) {
        return { isValid: true, repairedAnswer: option };
      }
    }
  }

  return {
    isValid: false,
    issue: `correctAnswer "${correctAnswer}" not found in options: ${question.options.join(', ')}`,
  };
}

export interface QuestionForValidation {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  points?: number;
  category?: string;
}

export interface QuestionValidationResult {
  repaired: QuestionForValidation;
  wasRepaired: boolean;
  issues: string[];
  rejected: boolean;
}

// Validate and repair a single question
export function validateAndRepairQuestion(question: QuestionForValidation): QuestionValidationResult {
  const issues: string[] = [];
  let wasRepaired = false;
  let rejected = false;

  const repaired = { ...question };

  // 1. Normalize question type
  const normalizedType = normalizeQuestionType(question.type);
  if (normalizedType !== question.type) {
    issues.push(`Normalized type from "${question.type}" to "${normalizedType}"`);
    repaired.type = normalizedType;
    wasRepaired = true;
  }

  // 2. Validate MC correctAnswer is in options
  if (repaired.type === 'multiple-choice') {
    const mcValidation = validateMultipleChoice(repaired);
    if (!mcValidation.isValid) {
      if (mcValidation.issue) {
        issues.push(mcValidation.issue);
      }
      rejected = true; // Can't repair, must reject
    } else if (mcValidation.repairedAnswer && mcValidation.repairedAnswer !== repaired.correctAnswer) {
      issues.push(`Repaired correctAnswer from "${repaired.correctAnswer}" to "${mcValidation.repairedAnswer}"`);
      repaired.correctAnswer = mcValidation.repairedAnswer;
      wasRepaired = true;
    }
  }

  // 3. Ensure required fields
  if (!repaired.question || repaired.question.trim().length < 10) {
    issues.push('Question text too short or missing');
    rejected = true;
  }

  if (!repaired.correctAnswer || repaired.correctAnswer.trim().length === 0) {
    issues.push('Missing correctAnswer');
    rejected = true;
  }

  // 4. Ensure points has valid value
  if (!repaired.points || repaired.points < 1) {
    repaired.points = repaired.type === 'short-answer' ? 2 : 1;
    wasRepaired = true;
  }

  // 5. Ensure MC has exactly 4 unique options
  if (repaired.type === 'multiple-choice') {
    if (!repaired.options || !Array.isArray(repaired.options)) {
      issues.push('Multiple choice question missing options array');
      rejected = true;
    } else if (repaired.options.length !== 4) {
      issues.push(`Multiple choice must have exactly 4 options, got ${repaired.options.length}`);
      rejected = true;
    } else {
      // Strip ALL option prefixes (handles double prefixes like "A. a. Nitrogen")
      const normalizedOptions = repaired.options.map(stripAllPrefixes);

      // Check for empty options AFTER normalization (catches "A)" with no content)
      const emptyIndices = normalizedOptions
        .map((opt, idx) => opt.length === 0 ? idx : -1)
        .filter(idx => idx !== -1);
      if (emptyIndices.length > 0) {
        issues.push(`Multiple choice has empty option(s) at position(s): ${emptyIndices.map(i => i + 1).join(', ')}`);
        rejected = true;
      }

      // Check for unique options (case-insensitive comparison of normalized content)
      const uniqueOptions = new Set(normalizedOptions.map(opt => opt.toLowerCase()));
      if (uniqueOptions.size !== 4) {
        issues.push('Multiple choice options must all be unique (found duplicates)');
        rejected = true;
      }

      // REPAIR: Re-add clean prefixes to options (fixes "A. a. Nitrogen" → "A) Nitrogen")
      if (!rejected) {
        const prefixes = ['A) ', 'B) ', 'C) ', 'D) '];
        repaired.options = normalizedOptions.map((opt, idx) => prefixes[idx] + opt);
        wasRepaired = true;
      }
    }
  }

  return { repaired, wasRepaired, issues, rejected };
}

// Validate batch of questions
export function validateAndRepairQuestions(questions: QuestionForValidation[]): {
  validQuestions: QuestionForValidation[];
  rejectedQuestions: { original: QuestionForValidation; issues: string[] }[];
  totalRepairs: number;
  allIssues: string[];
} {
  const validQuestions: QuestionForValidation[] = [];
  const rejectedQuestions: { original: QuestionForValidation; issues: string[] }[] = [];
  const allIssues: string[] = [];
  let totalRepairs = 0;

  for (let i = 0; i < questions.length; i++) {
    const { repaired, wasRepaired, issues, rejected } = validateAndRepairQuestion(questions[i]);

    if (issues.length > 0) {
      allIssues.push(...issues.map(issue => `Q${i + 1}: ${issue}`));
    }

    if (rejected) {
      rejectedQuestions.push({ original: questions[i], issues });
    } else {
      validQuestions.push(repaired);
      if (wasRepaired) totalRepairs++;
    }
  }

  return { validQuestions, rejectedQuestions, totalRepairs, allIssues };
}
