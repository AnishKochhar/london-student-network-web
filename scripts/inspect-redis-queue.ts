/**
 * Inspect Redis Queue Contents
 * Run: npx tsx scripts/inspect-redis-queue.ts
 *
 * This shows you what's currently in the BullMQ queue
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.error('❌ REDIS_URL not found in environment variables');
    process.exit(1);
}

async function inspectQueue() {
    console.log('🔍 Inspecting Event Email Reminders Queue...\n');

    const connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null // Required by BullMQ
    });
    const queue = new Queue('event-email-reminders', { connection });

    try {
        // Get queue counts
        console.log('📊 Queue Statistics:');
        const counts = await queue.getJobCounts(
            'wait',
            'delayed',
            'active',
            'completed',
            'failed'
        );
        console.log(`   Waiting: ${counts.wait}`);
        console.log(`   Delayed: ${counts.delayed}`);
        console.log(`   Active: ${counts.active}`);
        console.log(`   Completed: ${counts.completed}`);
        console.log(`   Failed: ${counts.failed}`);

        // Get waiting jobs
        if (counts.wait && counts.wait > 0) {
            console.log('\n📨 Waiting Jobs:');
            const waitingJobs = await queue.getJobs('wait', 0, 10);
            waitingJobs.forEach(job => {
                console.log(`   Job ${job.id}:`, job.data);
            });
        }

        // Get delayed jobs
        if (counts.delayed && counts.delayed > 0) {
            console.log('\n⏰ Delayed Jobs:');
            const delayedJobs = await queue.getJobs('delayed', 0, 10);
            delayedJobs.forEach(job => {
                // For delayed jobs, job.delay is the delay in ms from creation time
                // job.timestamp is when it was created
                // So execution time = job.timestamp + job.delay
                const executionTime = (job.timestamp || 0) + (job.delay || 0);
                const timeUntil = executionTime - Date.now();
                const hoursUntil = (timeUntil / (1000 * 60 * 60)).toFixed(2);

                // Format job info based on type
                let jobInfo = '';
                if (job.name === 'send_organizer_summary' || job.name === 'send_external_forwarding') {
                    jobInfo = `[${job.name}] for event ${job.data.event_id}`;
                } else {
                    // Reminder job
                    const identifier = job.data.user_id || job.data.guest_email || 'N/A';
                    jobInfo = `${identifier} for event ${job.data.event_id}`;
                }

                console.log(`   Job ${job.id}: ${jobInfo}`);
                console.log(`      Sends in: ${hoursUntil} hours`);
            });
        }

        // Get failed jobs
        if (counts.failed && counts.failed > 0) {
            console.log('\n❌ Failed Jobs:');
            const failedJobs = await queue.getJobs('failed', 0, 10);
            failedJobs.forEach(job => {
                console.log(`   Job ${job.id}:`, job.data);
                console.log(`      Attempts: ${job.attemptsMade}/${job.opts?.attempts || 3}`);
                console.log(`      Error: ${job.failedReason}`);
            });
        }

        // Get completed jobs (recent)
        if (counts.completed && counts.completed > 0) {
            console.log('\n✅ Recently Completed Jobs (last 10):');
            const completedJobs = await queue.getJobs('completed', 0, 10);
            completedJobs.forEach(job => {
                console.log(`   Job ${job.id}:`, job.data);
            });
        }

        console.log('\n✨ Queue inspection complete!\n');

    } catch (error) {
        console.error('\n❌ Failed to inspect queue:', error);
        process.exit(1);
    } finally {
        await queue.close();
        connection.disconnect();
    }
}

inspectQueue();
