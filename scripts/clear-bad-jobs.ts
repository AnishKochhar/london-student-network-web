/**
 * Clear Bad Jobs from Queue
 * Run: npx tsx scripts/clear-bad-jobs.ts
 *
 * This removes jobs with issues (null user_id, old format, admin events, etc.)
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const REDIS_URL = process.env.REDIS_URL;
const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";

if (!REDIS_URL) {
    console.error('❌ REDIS_URL not found in environment variables');
    process.exit(1);
}

async function clearBadJobs() {
    console.log('🧹 Clearing bad jobs from queue...\n');

    const connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null // Required by BullMQ
    });
    const queue = new Queue('event-email-reminders', { connection });

    try {
        let removedCount = 0;

        // Get all jobs (delayed, waiting, active)
        const delayedJobs = await queue.getJobs('delayed');
        const waitingJobs = await queue.getJobs('wait');
        const activeJobs = await queue.getJobs('active');
        const allJobs = [...delayedJobs, ...waitingJobs, ...activeJobs];

        console.log(`📊 Found ${allJobs.length} total jobs (${delayedJobs.length} delayed, ${waitingJobs.length} waiting, ${activeJobs.length} active)\n`);

        // Collect all unique event IDs from jobs
        const eventIds = new Set<string>();
        allJobs.forEach(job => {
            if (job.data.event_id) {
                eventIds.add(job.data.event_id);
            }
        });

        console.log(`🔍 Checking ${eventIds.size} unique events for admin ownership...\n`);

        // Query database to find which events are admin-created
        const adminEventIds = new Set<string>();
        if (eventIds.size > 0) {
            // Check each event individually (batch queries can be added if needed)
            for (const eventId of eventIds) {
                try {
                    const result = await sql`
                        SELECT id
                        FROM events
                        WHERE id = ${eventId}
                        AND organiser_uid = ${ADMIN_ID}
                    `;

                    if (result.rows.length > 0) {
                        adminEventIds.add(eventId);
                    }
                } catch (err) {
                    console.error(`Error checking event ${eventId}:`, err);
                }
            }

            if (adminEventIds.size > 0) {
                console.log(`⚠️  Found ${adminEventIds.size} admin-created events in queue\n`);
            }
        }

        // Process all jobs
        for (const job of allJobs) {
            let shouldRemove = false;
            let reason = '';

            // Check for admin events (PRIORITY CHECK)
            if (job.data.event_id && adminEventIds.has(job.data.event_id)) {
                shouldRemove = true;
                reason = 'admin-created event (no automated emails)';
            }
            // Check for jobs with null user_id (old format - before guest fix)
            else if (job.id?.includes('reminder-null-')) {
                shouldRemove = true;
                reason = 'null user_id (old format)';
            }
            // Check for jobs with missing guest data
            else if (!job.data.user_id && (!job.data.guest_email || !job.data.guest_name)) {
                shouldRemove = true;
                reason = 'missing guest data';
            }

            if (shouldRemove) {
                console.log(`🗑️  Removing job ${job.id}: ${reason}`);
                await job.remove();
                removedCount++;
            }
        }

        console.log(`\n✅ Cleaned up ${removedCount} bad jobs`);

        // Show remaining jobs
        const finalCounts = await queue.getJobCounts('wait', 'delayed', 'active');
        console.log('\n📊 Remaining jobs:');
        console.log(`   Waiting: ${finalCounts.wait}`);
        console.log(`   Delayed: ${finalCounts.delayed}`);
        console.log(`   Active: ${finalCounts.active}`);

    } catch (error) {
        console.error('\n❌ Failed to clear jobs:', error);
        process.exit(1);
    } finally {
        await queue.close();
        connection.disconnect();
    }
}

clearBadJobs();
