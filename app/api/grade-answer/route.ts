import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

interface GradeRequest {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  topic?: string;
}

interface GradeResponse {
  isCorrect: boolean;
  score: number; // 0, 0.5, or 1 (partial credit)
  feedback: string;
}

export async function POST(request: NextRequest) {
  let body: GradeRequest | undefined;
  try {
    // Cost-abuse protection: 60 grading requests per IP per minute
    const rateLimit = checkRateLimit('grade-answer', getClientIp(request), 60, 60 * 1000);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback to exact matching if no API key
      const isCorrect = body.userAnswer.trim().toLowerCase() === body.correctAnswer.trim().toLowerCase();
      return NextResponse.json({
        isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect ? 'Correct!' : `The correct answer is: ${body.correctAnswer}`,
      });
    }

    const { question, correctAnswer, userAnswer, topic } = body;

    if (!question || !correctAnswer || userAnswer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Quick exact match check first (avoid API call)
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    if (normalizedUser === normalizedCorrect) {
      return NextResponse.json({
        isCorrect: true,
        score: 1,
        feedback: 'Correct!',
      });
    }

    // Empty answer
    if (!normalizedUser) {
      return NextResponse.json({
        isCorrect: false,
        score: 0,
        feedback: `No answer provided. The correct answer is: ${correctAnswer}`,
      });
    }

    // Use AI for semantic grading
    const openai = getOpenAI();

    const prompt = `You are grading a Science Olympiad ${topic || 'science'} short-answer question.

QUESTION: ${question}
CORRECT ANSWER: ${correctAnswer}
STUDENT'S ANSWER: ${userAnswer}

Grade the student's answer using these criteria:
1. CORRECT (score: 1) - Answer is correct, even if:
   - Uses synonyms or equivalent terms
   - Has minor spelling errors but intent is clear
   - Uses acceptable abbreviations
   - Includes extra correct information

2. PARTIALLY CORRECT (score: 0.5) - Answer shows understanding but:
   - Is incomplete
   - Has minor errors but shows core understanding
   - Is too vague but in right direction

3. INCORRECT (score: 0) - Answer is:
   - Wrong
   - Shows misunderstanding
   - Completely off-topic

Return JSON only:
{
  "isCorrect": true/false,
  "score": 0 or 0.5 or 1,
  "feedback": "Brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fair but strict Science Olympiad grader. Grade answers accurately. Output valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Very low for consistent grading
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      // Fallback to exact matching
      return NextResponse.json({
        isCorrect: false,
        score: 0,
        feedback: `The correct answer is: ${correctAnswer}`,
      });
    }

    const result: GradeResponse = JSON.parse(content);

    // Ensure proper feedback if incorrect
    if (!result.isCorrect && result.score === 0 && !result.feedback.includes(correctAnswer)) {
      result.feedback = `${result.feedback} The correct answer is: ${correctAnswer}`;
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Grading error:', error);

    // Fallback to simple matching on error (body was already parsed above)
    try {
      const isCorrect = body!.userAnswer?.trim().toLowerCase() === body!.correctAnswer?.trim().toLowerCase();
      return NextResponse.json({
        isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect ? 'Correct!' : `The correct answer is: ${body!.correctAnswer}`,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to grade answer' },
        { status: 500 }
      );
    }
  }
}
