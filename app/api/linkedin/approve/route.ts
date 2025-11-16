import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { auth } from '@/auth';
import { LinkedInClient } from '@/app/lib/linkedin/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/linkedin/approve
 * Approve and publish a LinkedIn post
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Only admin can approve
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queueId } = body;

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID required' }, { status: 400 });
    }

    // Get the post from queue
    const queueResult = await sql`
      SELECT post_content, event_ids, status
      FROM linkedin_post_queue
      WHERE id = ${queueId}
    `;

    if (queueResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = queueResult.rows[0];

    if (post.status !== 'pending') {
      return NextResponse.json({
        error: `Cannot approve post with status: ${post.status}`,
      }, { status: 400 });
    }

    // Publish to LinkedIn
    const linkedin = new LinkedInClient();
    const publishResult = await linkedin.publishPost(post.post_content);

    // Update queue with published status
    await sql`
      UPDATE linkedin_post_queue
      SET
        status = 'approved',
        approved_at = NOW(),
        approved_by = ${session.user.email},
        published_at = NOW(),
        linkedin_post_id = ${publishResult.id}
      WHERE id = ${queueId}
    `;

    // Mark events as featured
    const eventIds = post.event_ids as string[];
    for (const eventId of eventIds) {
      await sql`
        UPDATE events
        SET
          featured_in_linkedin_post = true,
          last_linkedin_feature_date = NOW()
        WHERE id = ${eventId}
      `;
    }

    console.log(`[LinkedIn Approve] ✅ Post approved and published: ${publishResult.id}`);

    return NextResponse.json({
      success: true,
      linkedInPostId: publishResult.id,
      message: 'Post approved and published successfully',
    });
  } catch (error) {
    console.error('[LinkedIn Approve API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve post',
    }, { status: 500 });
  }
}
