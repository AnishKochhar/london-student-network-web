import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { fetchAllUpcomingEvents } from '@/app/lib/data';
import { LLMClientWithFallback } from '@/app/lib/llm/client-with-fallback';
import { LinkedInClient } from '@/app/lib/linkedin/client';
import { shouldAutoApprove } from '@/app/lib/linkedin/auto-approval';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[CRON LinkedIn] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[CRON LinkedIn] Starting LinkedIn post generation at ${new Date().toISOString()}`);

    // Step 1: Fetch upcoming events (next 7-14 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const allEvents = await fetchAllUpcomingEvents(null); // Public events only

    // Filter to events in the next 7-14 days
    const upcomingEvents = allEvents.filter((event) => {
      const eventDate = event.start_datetime
        ? new Date(event.start_datetime)
        : new Date(event.year, event.month - 1, event.day);

      return eventDate >= sevenDaysFromNow && eventDate <= fourteenDaysFromNow;
    });

    // Filter to only public/students_only events
    const publicEvents = upcomingEvents.filter((event) =>
      ['public', 'students_only'].includes(event.visibility_level || 'public')
    );

    // Exclude events already featured in the last 30 days
    const eligibleEvents = publicEvents.filter((event) => {
      if (!event.featured_in_linkedin_post) return true;
      if (!event.last_linkedin_feature_date) return true;

      const lastFeatured = new Date(event.last_linkedin_feature_date);
      const daysSinceFeature = (now.getTime() - lastFeatured.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceFeature > 30;
    });

    console.log(`[CRON LinkedIn] Found ${eligibleEvents.length} eligible events`);

    if (eligibleEvents.length === 0) {
      console.log('[CRON LinkedIn] No eligible events to post about');
      return NextResponse.json({
        success: true,
        message: 'No eligible events found',
        eventsChecked: publicEvents.length,
      });
    }

    // Step 2: Use LLM to filter and select best 1-2 events
    const llm = new LLMClientWithFallback();
    const selectedEventScores = await llm.filterEvents(eligibleEvents);

    if (selectedEventScores.length === 0) {
      console.log('[CRON LinkedIn] No events selected by LLM filter');
      return NextResponse.json({
        success: true,
        message: 'No events selected by LLM',
        eventsAnalyzed: eligibleEvents.length,
      });
    }

    // Get full event objects for selected events
    const selectedEvents = eligibleEvents.filter((event) =>
      selectedEventScores.some((score) => score.event_id === event.id)
    );

    console.log(`[CRON LinkedIn] Selected ${selectedEvents.length} events:`, selectedEvents.map((e) => e.title));

    // Step 3: Generate LinkedIn post content
    const postContent = await llm.generatePost(selectedEvents);

    console.log(`[CRON LinkedIn] Generated post (${postContent.length} chars)`);

    // Step 4: Save to queue
    const eventIds = selectedEvents.map((e) => e.id);
    const eventData = selectedEvents.map((e) => ({
      id: e.id,
      title: e.title,
      organiser: e.organiser,
      start_datetime: e.start_datetime,
    }));

    const insertResult = await sql`
      INSERT INTO linkedin_post_queue
        (post_content, event_ids, event_data, status)
      VALUES
        (${postContent}, ${eventIds}, ${JSON.stringify(eventData)}, 'pending')
      RETURNING id
    `;

    const queueId = insertResult.rows[0].id;

    console.log(`[CRON LinkedIn] Saved to queue with ID: ${queueId}`);

    // Step 5: Check if we should auto-approve
    const autoApprove = await shouldAutoApprove();

    if (autoApprove) {
      console.log('[CRON LinkedIn] Auto-approval enabled, publishing immediately...');

      try {
        const linkedin = new LinkedInClient();
        const publishResult = await linkedin.publishPost(postContent);

        // Update queue with published status
        await sql`
          UPDATE linkedin_post_queue
          SET
            status = 'published',
            published_at = NOW(),
            linkedin_post_id = ${publishResult.id},
            auto_approved = true
          WHERE id = ${queueId}
        `;

        // Mark events as featured
        for (const eventId of eventIds) {
          await sql`
            UPDATE events
            SET
              featured_in_linkedin_post = true,
              last_linkedin_feature_date = NOW()
            WHERE id = ${eventId}
          `;
        }

        console.log(`[CRON LinkedIn] ✅ Published successfully: ${publishResult.id}`);

        return NextResponse.json({
          success: true,
          action: 'auto_published',
          queueId,
          linkedInPostId: publishResult.id,
          eventsCount: selectedEvents.length,
        });
      } catch (publishError) {
        console.error('[CRON LinkedIn] Auto-publish failed:', publishError);

        // Update queue with error
        await sql`
          UPDATE linkedin_post_queue
          SET
            error_log = ${publishError instanceof Error ? publishError.message : String(publishError)}
          WHERE id = ${queueId}
        `;

        return NextResponse.json({
          success: false,
          error: 'Auto-publish failed',
          queueId,
          message: publishError instanceof Error ? publishError.message : 'Unknown error',
        }, { status: 500 });
      }
    } else {
      console.log('[CRON LinkedIn] Manual approval required');

      return NextResponse.json({
        success: true,
        action: 'pending_approval',
        queueId,
        eventsCount: selectedEvents.length,
        message: 'Post created and awaiting approval',
      });
    }
  } catch (error) {
    console.error('[CRON LinkedIn] Fatal error during cron job execution:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
