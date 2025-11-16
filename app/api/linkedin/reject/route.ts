import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/linkedin/reject
 * Reject a LinkedIn post draft
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Only admin can reject
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queueId, reason } = body;

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID required' }, { status: 400 });
    }

    // Update queue with rejected status
    await sql`
      UPDATE linkedin_post_queue
      SET
        status = 'rejected',
        approved_at = NOW(),
        approved_by = ${session.user.email},
        rejection_reason = ${reason || 'No reason provided'}
      WHERE id = ${queueId}
    `;

    console.log(`[LinkedIn Reject] Post rejected: ${queueId}`);

    return NextResponse.json({
      success: true,
      message: 'Post rejected successfully',
    });
  } catch (error) {
    console.error('[LinkedIn Reject API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject post',
    }, { status: 500 });
  }
}
