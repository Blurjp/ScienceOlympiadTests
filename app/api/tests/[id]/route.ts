import { NextRequest, NextResponse } from 'next/server';
import { getTest, getTestOwner, deleteTest } from '@/lib/database';
import { isAdminEmail } from '@/lib/admin-auth';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const test = await getTest(params.id);

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test from database' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require an authenticated session
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const existing = await getTestOwner(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Only the owner or an admin may delete a test
    const isAdmin = Boolean(session.user?.email && isAdminEmail(session.user.email));
    if (existing.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this test' },
        { status: 403 }
      );
    }

    await deleteTest(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete test from database' },
      { status: 500 }
    );
  }
}
