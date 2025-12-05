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
function findSuspiciousPhrases(
  generatedText: string,
  sourceKeywords: string[]
): string[] {
  const flagged: string[] = [];
  const lowerGenerated = generatedText.toLowerCase();

  // Check for exact keyword matches that suggest copying
  for (const keyword of sourceKeywords) {
    if (keyword.length > 10 && lowerGenerated.includes(keyword.toLowerCase())) {
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
