import { NextResponse } from 'next/server';
import { Worker, Job } from 'bullmq';
import getRedisClient from '@/app/lib/config/private/redis';
import { sendEventRegistrationEmail } from '@/app/lib/send-email';
import { sql } from '@vercel/postgres';
import { convertSQLEventToEvent } from '@/app/lib/utils';
import { scheduleEventEmailReminder } from '@/app/lib/functions/events/schedule-event-email-reminder';
import EventRegistrationEmailPayload from '@/app/components/templates/event-registration-email';
import EventRegistrationEmailFallbackPayload from '@/app/components/templates/event-registration-email-fallback';
import { SQLEvent } from '@/app/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

let worker: Worker | null = null;

async function getWorker() {
    if (!worker) {
        const connection = await getRedisClient();

        worker = new Worker(
            'event-email-reminders',
            async (job: Job) => {
                const { user_id, event_id, attempts } = job.data;

                console.log(`[WORKER] Processing reminder job for user ${user_id}, event ${event_id}, attempt ${attempts + 1}`);

                // Safety check: Don't retry more than 3 times
                if (attempts > 3) {
                    console.log(`[WORKER] Max attempts reached for user ${user_id}, event ${event_id}`);
                    return { success: false, reason: 'max_attempts_reached' };
                }

                try {
                    // Fetch user information
                    const userResult = await sql`
                        SELECT id, name, email
                        FROM users
                        WHERE id = ${user_id}
                    `;

                    if (userResult.rows.length === 0) {
                        console.error(`[WORKER] User ${user_id} not found`);
                        return { success: false, reason: 'user_not_found' };
                    }

                    const user = userResult.rows[0];

                    // Fetch event information
                    const eventResult = await sql`
                        SELECT *
                        FROM events
                        WHERE id = ${event_id}
                        AND is_deleted = false
                    `;

                    if (eventResult.rows.length === 0) {
                        console.error(`[WORKER] Event ${event_id} not found or deleted`);
                        return { success: false, reason: 'event_not_found' };
                    }

                    const sqlEvent = eventResult.rows[0];
                    const event = convertSQLEventToEvent(sqlEvent as SQLEvent);

                    // Check if event has already started
                    const now = new Date();
                    const eventStart = event.start_datetime ? new Date(event.start_datetime) : null;

                    if (eventStart && now > eventStart) {
                        console.log(`[WORKER] Event ${event_id} has already started, skipping reminder`);
                        return { success: true, reason: 'event_already_started' };
                    }

                    // Send reminder email
                    const emailSubject = `🔔 Reminder: ${event.title} starts soon!`;
                    const emailHtml = EventRegistrationEmailPayload(user.name as string, event);
                    const emailText = EventRegistrationEmailFallbackPayload(user.name as string, event);

                    await sendEventRegistrationEmail({
                        toEmail: user.email as string,
                        subject: emailSubject,
                        html: emailHtml,
                        text: emailText,
                    });

                    console.log(`[WORKER] Reminder email sent successfully to ${user.email} for event ${event_id}`);

                    return { success: true };

                } catch (error) {
                    console.error(`[WORKER] Error processing job:`, error);

                    // Schedule retry with exponential backoff if we haven't hit max attempts
                    if (attempts < 3) {
                        const retryDelay = 60 * 60 * (attempts + 1); // 1 hour * attempt number
                        console.log(`[WORKER] Scheduling retry in ${retryDelay} seconds`);

                        await scheduleEventEmailReminder({
                            user_id,
                            event_id,
                            attempts: attempts + 1,
                            buffer_time: retryDelay
                        });
                    }

                    throw error; // Re-throw to mark job as failed
                }
            },
            { connection }
        );

        worker.on('completed', (job) => {
            console.log(`[WORKER] Job ${job.id} completed successfully`);
        });

        worker.on('failed', (job, err) => {
            console.error(`[WORKER] Job ${job?.id} failed:`, err.message);
        });
    }

    return worker;
}

export async function GET(request: Request) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('[WORKER] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[WORKER] Starting worker process');

        // Initialize worker (it will automatically process jobs in the background)
        await getWorker();

        // Let the worker run for 50 seconds (within the 60 second limit)
        // The worker will automatically process jobs from the queue
        await new Promise(resolve => setTimeout(resolve, 50000));

        console.log('[WORKER] Worker process complete');

        return NextResponse.json({
            success: true,
            message: 'Worker processed jobs for 50 seconds',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[WORKER] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
