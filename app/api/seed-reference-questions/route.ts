import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  saveReferenceQuestionsBatch,
  getReferenceQuestionStats,
} from '@/lib/database';
import { SEED_REFERENCE_QUESTIONS } from '@/lib/seed-reference-questions';

export const dynamic = 'force-dynamic';

// This is an admin-only endpoint to seed the reference questions database
// with high-quality example questions for few-shot learning

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow specific admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current stats before seeding
    const statsBefore = await getReferenceQuestionStats();

    // Seed the database with reference questions
    const imported = await saveReferenceQuestionsBatch(SEED_REFERENCE_QUESTIONS);

    // Get stats after seeding
    const statsAfter = await getReferenceQuestionStats();

    return NextResponse.json({
      message: 'Reference questions seeded successfully',
      imported,
      totalAvailable: SEED_REFERENCE_QUESTIONS.length,
      statsBefore,
      statsAfter,
    });
  } catch (error: any) {
    console.error('Error seeding reference questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow specific admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current stats
    const stats = await getReferenceQuestionStats();

    return NextResponse.json({
      message: 'Reference questions stats',
      availableSeedQuestions: SEED_REFERENCE_QUESTIONS.length,
      seedQuestionsByTopic: SEED_REFERENCE_QUESTIONS.reduce((acc, q) => {
        acc[q.topic] = (acc[q.topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      databaseStats: stats,
    });
  } catch (error: any) {
    console.error('Error getting reference question stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
