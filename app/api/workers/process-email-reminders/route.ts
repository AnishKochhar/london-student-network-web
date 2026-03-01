import { NextResponse } from 'next/server';
import { Job, Worker } from 'bullmq';
import getRedisClient from '@/app/lib/config/private/redis';
import { sendEventRegistrationEmail, sendExternalForwardingEmail } from '@/app/lib/send-email';
import { sql } from '@vercel/postgres';
import { convertSQLEventToEvent } from '@/app/lib/utils';
import { scheduleEventEmailReminder } from '@/app/lib/functions/events/schedule-event-email-reminder';
import { scheduleExternalForwardingEmail } from '@/app/lib/functions/events/schedule-external-forwarding-email';
import { scheduleOrganizerSummaryEmail } from '@/app/lib/functions/events/schedule-organizer-summary-email';
import EventRegistrationEmailPayload from '@/app/components/templates/event-registration-email';
import EventRegistrationEmailFallbackPayload from '@/app/components/templates/event-registration-email-fallback';
import EventOrganizerSummaryEmailPayload from '@/app/components/templates/event-organizer-summary-email';
import EventOrganizerSummaryEmailFallbackPayload from '@/app/components/templates/event-organizer-summary-email-fallback';
import { SQLEvent } from '@/app/lib/types';
import { getEventOrganiserEmail, getSummaryRecipients } from '@/app/lib/data';
import { reminderQueue } from '@/app/lib/config/private/bullmq-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

// Worker token for job locking - unique per cron invocation
const WORKER_TOKEN = `cron-worker-${Date.now()}`;

// Handler for user reminder emails
async function handleUserReminder(job: Job) {
    const { user_id, event_id, attempts, guest_email, guest_name } = job.data;

    const identifier = user_id || guest_email;
    console.log(`[WORKER] Processing reminder job for ${identifier}, event ${event_id}, attempt ${attempts + 1}`);

    // Safety check: Don't retry more than 3 times
    if (attempts > 3) {
        console.log(`[WORKER] Max attempts reached for ${identifier}, event ${event_id}`);
        return { success: false, reason: 'max_attempts_reached' };
    }

    try {
        // Fetch user information (either from users table or use guest data)
        let user: { name: string; email: string };

        if (user_id) {
            // Registered user - fetch from database
            const userResult = await sql`
                SELECT id, name, email
                FROM users
                WHERE id = ${user_id}
            `;

            if (userResult.rows.length === 0) {
                console.error(`[WORKER] User ${user_id} not found`);
                return { success: false, reason: 'user_not_found' };
            }

            user = {
                name: userResult.rows[0].name as string,
                email: userResult.rows[0].email as string
            };
        } else {
            // Guest registration - use data from job
            if (!guest_email || !guest_name) {
                console.error(`[WORKER] Guest data missing for event ${event_id}`);
                return { success: false, reason: 'guest_data_missing' };
            }

            user = {
                name: guest_name,
                email: guest_email
            };
            console.log(`[WORKER] Processing guest reminder for ${guest_email}`);
        }

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

        // SAFETY CHECK: Skip admin-created events (scraped/manually added)
        const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
        if (sqlEvent.organiser_uid === ADMIN_ID) {
            console.log(`[WORKER] ⚠️ Skipping admin-created event ${event_id} - no automated emails for admin events`);
            return { success: true, reason: 'admin_event_skipped' };
        }

        // Check if event has already started
        const now = new Date();
        const eventStart = event.start_datetime ? new Date(event.start_datetime) : null;

        if (eventStart && now > eventStart) {
            console.log(`[WORKER] Event ${event_id} has already started, skipping reminder`);
            return { success: true, reason: 'event_already_started' };
        }

        // Fetch organizer email for reply-to
        const organizerEmailResult = await getEventOrganiserEmail(sqlEvent.organiser_uid as string);
        const organizerEmail = organizerEmailResult?.email;

        // Send reminder email
        const emailSubject = `🔔 Reminder: ${event.title} starts soon!`;
        const emailHtml = EventRegistrationEmailPayload(user.name as string, event);
        const emailText = EventRegistrationEmailFallbackPayload(user.name as string, event);

        await sendEventRegistrationEmail({
            toEmail: user.email as string,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
            replyTo: organizerEmail, // Reply to organizer
        });

        console.log(`[WORKER] Reminder email sent successfully to ${user.email} for event ${event_id}`);

        return { success: true };

    } catch (error) {
        console.error(`[WORKER] Error processing user reminder job:`, error);

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
}

// Handler for external forwarding emails
async function handleExternalForwarding(job: Job) {
    const { event_id } = job.data;

    console.log(`[WORKER] Processing external forwarding for event ${event_id}`);

    try {
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

        // SAFETY CHECK: Skip admin-created events
        const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
        if (sqlEvent.organiser_uid === ADMIN_ID) {
            console.log(`[WORKER] ⚠️ Skipping external forwarding for admin event ${event_id}`);
            return { success: true, reason: 'admin_event_skipped' };
        }

        if (!sqlEvent.external_forward_email || sqlEvent.external_forward_email.trim() === '') {
            console.log(`[WORKER] No external forwarding email configured for event ${event_id}`);
            return { success: true, reason: 'no_external_email_configured' };
        }

        const event = convertSQLEventToEvent(sqlEvent as SQLEvent);

        // Fetch organizer email for reply-to
        const organizerEmailResult = await getEventOrganiserEmail(sqlEvent.organiser_uid as string);
        const organizerEmail = organizerEmailResult?.email;

        // Fetch all registrations
        const registrationsResult = await sql`
            SELECT name, email, external
            FROM event_registrations
            WHERE event_id = ${event_id}
        `;

        const registrationsList = registrationsResult.rows.map(reg => ({
            name: reg.name as string,
            email: reg.email as string,
            external: reg.external as boolean
        }));

        // Send external forwarding email
        await sendExternalForwardingEmail({
            externalEmail: sqlEvent.external_forward_email as string,
            event,
            registrations: registrationsList,
            organizerEmail, // Reply to organizer
        });

        console.log(`[WORKER] External forwarding email sent to ${sqlEvent.external_forward_email} for event ${event_id}`);

        return { success: true };

    } catch (error) {
        console.error(`[WORKER] Error processing external forwarding job:`, error);

        // Retry once after 1 hour
        const retryDelay = 60 * 60;
        console.log(`[WORKER] Scheduling external forwarding retry in ${retryDelay} seconds`);

        await scheduleExternalForwardingEmail({
            event_id,
            buffer_time: retryDelay
        });

        throw error;
    }
}

// Handler for organizer summary emails
async function handleOrganizerSummary(job: Job) {
    const { event_id } = job.data;

    console.log(`[WORKER] Processing organizer summary for event ${event_id}`);

    try {
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

        // SAFETY CHECK: Skip admin-created events
        const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
        if (sqlEvent.organiser_uid === ADMIN_ID) {
            console.log(`[WORKER] ⚠️ Skipping organizer summary for admin event ${event_id}`);
            return { success: true, reason: 'admin_event_skipped' };
        }

        // Fetch all summary email recipients (co-hosts with receives_summary_emails)
        const summaryRecipients = await getSummaryRecipients(event_id);

        if (summaryRecipients.length === 0) {
            console.error(`[WORKER] No summary recipients found for event ${event_id}`);
            return { success: false, reason: 'no_summary_recipients' };
        }

        // Fetch all registrations
        const registrationsResult = await sql`
            SELECT name, email, external
            FROM event_registrations
            WHERE event_id = ${event_id}
        `;

        const registrationsList = registrationsResult.rows.map(reg => ({
            name: reg.name as string,
            email: reg.email as string,
            external: reg.external as boolean
        }));

        // Send summary email to each recipient
        const emailSubject = `📊 Event Summary: ${event.title} - Tomorrow!`;
        const emailHtml = EventOrganizerSummaryEmailPayload(event, registrationsList);
        const emailText = EventOrganizerSummaryEmailFallbackPayload(event, registrationsList);

        for (const recipient of summaryRecipients) {
            try {
                await sendEventRegistrationEmail({
                    toEmail: recipient.email,
                    subject: emailSubject,
                    html: emailHtml,
                    text: emailText,
                });
                console.log(`[WORKER] Summary email sent to ${recipient.email} for event ${event_id}`);
            } catch (recipientError) {
                console.error(`[WORKER] Failed to send summary to ${recipient.email}:`, recipientError);
            }
        }

        return { success: true };

    } catch (error) {
        console.error(`[WORKER] Error processing organizer summary job:`, error);

        // Retry once after 1 hour
        const retryDelay = 60 * 60;
        console.log(`[WORKER] Scheduling organizer summary retry in ${retryDelay} seconds`);

        await scheduleOrganizerSummaryEmail({
            event_id,
            buffer_time: retryDelay
        });

        throw error;
    }
}

// Process a single job based on its type
async function processJob(job: Job): Promise<{ success: boolean; reason?: string }> {
    console.log(`[WORKER] Processing job ${job.id}, type: ${job.name}`);

    switch (job.name) {
        case 'send_event_email_reminder':
            return await handleUserReminder(job);
        case 'send_external_forwarding':
            return await handleExternalForwarding(job);
        case 'send_organizer_summary':
            return await handleOrganizerSummary(job);
        default:
            console.error(`[WORKER] Unknown job type: ${job.name}`);
            return { success: false, reason: 'unknown_job_type' };
    }
}

export async function GET(request: Request) {
    let worker: Worker | null = null;

    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('[WORKER] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[WORKER] Starting worker process');

        // Check queue status FIRST - exit early if nothing to process
        // These methods ARE available on Queue class
        const waitingCount = await reminderQueue.getWaitingCount();
        const delayedCount = await reminderQueue.getDelayedCount();
        const activeCount = await reminderQueue.getActiveCount();

        console.log(`[WORKER] Queue status - Waiting: ${waitingCount}, Delayed: ${delayedCount}, Active: ${activeCount}`);

        // If no jobs are ready to process, exit immediately (saves compute!)
        if (waitingCount === 0 && activeCount === 0) {
            console.log('[WORKER] No jobs ready to process, exiting early');
            return NextResponse.json({
                success: true,
                message: 'No jobs to process',
                queueStatus: { waiting: waitingCount, delayed: delayedCount, active: activeCount },
                jobsProcessed: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Create a Worker instance for manual job fetching
        // getNextJob() is a Worker method, not a Queue method
        const connection = await getRedisClient();
        worker = new Worker('event-email-reminders', undefined, {
            connection,
            lockDuration: 60000, // 60 second lock (matches our maxDuration)
            drainDelay: 1, // Only wait 1 second when queue is empty (default is 5s)
        });

        let jobsProcessed = 0;
        let jobsFailed = 0;
        const startTime = Date.now();
        const maxRuntime = 55000; // 55 seconds max to stay within 60s limit

        // Process jobs until queue is empty or we hit time limit
        while (Date.now() - startTime < maxRuntime) {
            // getNextJob blocks until a job is available or drainDelay expires (default 5s)
            // Use a short timeout to check frequently but not block forever
            const job = await worker.getNextJob(WORKER_TOKEN);

            if (!job) {
                // No more jobs available, we're done
                console.log('[WORKER] No more jobs in queue');
                break;
            }

            try {
                const result = await processJob(job);

                if (result.success) {
                    await job.moveToCompleted(result, WORKER_TOKEN, false);
                    jobsProcessed++;
                    console.log(`[WORKER] Job ${job.id} completed successfully`);
                } else {
                    await job.moveToFailed(new Error(result.reason || 'Job failed'), WORKER_TOKEN, false);
                    jobsFailed++;
                    console.log(`[WORKER] Job ${job.id} marked as failed: ${result.reason}`);
                }
            } catch (error) {
                // Job processing threw an error
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                await job.moveToFailed(new Error(errorMessage), WORKER_TOKEN, false);
                jobsFailed++;
                console.error(`[WORKER] Job ${job.id} failed with error:`, errorMessage);
            }

            // Check if queue is now empty (avoid waiting for drainDelay on next iteration)
            const remainingJobs = await reminderQueue.getWaitingCount();
            if (remainingJobs === 0) {
                console.log('[WORKER] Queue drained, exiting');
                break;
            }
        }

        const runtime = Math.round((Date.now() - startTime) / 1000);
        console.log(`[WORKER] Worker complete - processed ${jobsProcessed} jobs, ${jobsFailed} failed, runtime ${runtime}s`);

        return NextResponse.json({
            success: true,
            message: `Processed ${jobsProcessed} jobs in ${runtime}s`,
            jobsProcessed,
            jobsFailed,
            runtime: `${runtime}s`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[WORKER] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } finally {
        // Always close the worker to release Redis connection
        if (worker) {
            await worker.close();
        }
    }
}
