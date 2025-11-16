import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/linkedin/queue
 * Fetch pending LinkedIn posts for admin review
 */
export async function GET() {
  try {
    const session = await auth();

    // Only admin can access
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT
        id,
        post_content,
        event_ids,
        event_data,
        status,
        created_at,
        approved_at,
        approved_by,
        published_at,
        rejection_reason,
        linkedin_post_id,
        auto_approved,
        error_log
      FROM linkedin_post_queue
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      success: true,
      posts: result.rows,
    });
  } catch (error) {
    console.error('[LinkedIn Queue API] Error fetching queue:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch queue',
    }, { status: 500 });
  }
}
