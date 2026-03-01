import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { scheduleEventEmailReminder } from '@/app/lib/functions/events/schedule-event-email-reminder';
import { scheduleExternalForwardingEmail } from '@/app/lib/functions/events/schedule-external-forwarding-email';
import { scheduleOrganizerSummaryEmail } from '@/app/lib/functions/events/schedule-organizer-summary-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes - handles large events with many registrations

export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('Unauthorized cron job access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[CRON] Starting event reminder scan at ${new Date().toISOString()}`);

        // Find events starting in the next 3-30 hours
        // Lower bound (3hrs): Minimum notice for user reminders
        // Upper bound (30hrs): Covers 24-hour external/organizer emails + buffer
        const now = new Date();
        const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const in30Hours = new Date(now.getTime() + 30 * 60 * 60 * 1000);

        // Query events that haven't been deleted and are starting soon
        const eventsResult = await sql`
            SELECT
                id,
                title,
                description,
                organiser,
                organiser_uid,
                start_datetime,
                end_datetime,
                is_multi_day,
                location_building,
                location_area,
                location_address,
                image_url,
                image_contain,
                event_type,
                external_forward_email,
                capacity,
                sign_up_link,
                for_externals,
                send_signup_notifications
            FROM events
            WHERE start_datetime BETWEEN ${in3Hours.toISOString()} AND ${in30Hours.toISOString()}
            AND is_deleted = false
            AND is_hidden = false
        `;

        console.log(`[CRON] Found ${eventsResult.rows.length} events starting in 24 hours`);

        let totalRemindersScheduled = 0;
        let totalExternalEmailsScheduled = 0;
        let totalOrganizerSummariesScheduled = 0;
        const errors: string[] = [];

        // Admin user ID - events created by admin should not send automated emails
        const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";

        // Process each event
        for (const sqlEvent of eventsResult.rows) {
            try {
                console.log(`[CRON] Processing event: ${sqlEvent.title} (${sqlEvent.id})`);

                // Skip admin-created events (scraped/manually added events without LSN organizer)
                if (sqlEvent.organiser_uid === ADMIN_ID) {
                    console.log(`[CRON] ⚠️ Skipping admin-created event: ${sqlEvent.title} - no automated emails for admin events`);
                    continue;
                }

                // Fetch all registrations for this event
                const registrationsResult = await sql`
                    SELECT
                        user_id,
                        name,
                        email,
                        external
                    FROM event_registrations
                    WHERE event_id = ${sqlEvent.id}
                `;

                console.log(`[CRON] Found ${registrationsResult.rows.length} registrations for event ${sqlEvent.id}`);

                // Schedule reminder emails for each registered user (3 hours before event)
                const eventStartTime = new Date(sqlEvent.start_datetime as string).getTime();
                const userReminderTime = eventStartTime - (3 * 60 * 60 * 1000); // 3 hours before
                const userReminderDelay = Math.max(0, Math.floor((userReminderTime - now.getTime()) / 1000));

                // Only schedule if reminder time is in the future
                if (userReminderTime > now.getTime()) {
                    for (const registration of registrationsResult.rows) {
                        try {
                            // Handle both registered users and guests
                            if (registration.user_id) {
                                // Registered user
                                await scheduleEventEmailReminder({
                                    user_id: registration.user_id,
                                    event_id: sqlEvent.id as string,
                                    attempts: 0,
                                    buffer_time: userReminderDelay
                                });
                                console.log(`[CRON] Scheduled reminder for user ${registration.user_id}`);
                            } else {
                                // Guest registration
                                await scheduleEventEmailReminder({
                                    user_id: null,
                                    event_id: sqlEvent.id as string,
                                    attempts: 0,
                                    buffer_time: userReminderDelay,
                                    guest_email: registration.email,
                                    guest_name: registration.name
                                });
                                console.log(`[CRON] Scheduled reminder for guest ${registration.email}`);
                            }
                            totalRemindersScheduled++;
                        } catch (reminderError) {
                            const identifier = registration.user_id || registration.email;
                            console.error(`[CRON] Failed to schedule reminder for ${identifier}:`, reminderError);
                            errors.push(`Failed to schedule reminder for ${identifier} in event ${sqlEvent.id}`);
                        }
                    }
                }

                // Schedule external forwarding email (24 hours before event)
                const externalEmailTime = eventStartTime - (24 * 60 * 60 * 1000); // 24 hours before
                const externalEmailDelay = Math.max(0, Math.floor((externalEmailTime - now.getTime()) / 1000));

                if (sqlEvent.external_forward_email && sqlEvent.external_forward_email.trim() !== '' && externalEmailTime > now.getTime()) {
                    try {
                        await scheduleExternalForwardingEmail({
                            event_id: sqlEvent.id as string,
                            buffer_time: externalEmailDelay
                        });
                        totalExternalEmailsScheduled++;
                        console.log(`[CRON] Scheduled external forwarding email for event ${sqlEvent.id} in ${externalEmailDelay}s`);
                    } catch (externalEmailError) {
                        console.error(`[CRON] Failed to schedule external email for event ${sqlEvent.id}:`, externalEmailError);
                        errors.push(`Failed to schedule external email for event ${sqlEvent.id}`);
                    }
                }

                // Schedule organizer summary email (24 hours before event, always sent)
                const organizerSummaryTime = eventStartTime - (24 * 60 * 60 * 1000); // 24 hours before
                const organizerSummaryDelay = Math.max(0, Math.floor((organizerSummaryTime - now.getTime()) / 1000));

                if (organizerSummaryTime > now.getTime()) {
                    try {
                        await scheduleOrganizerSummaryEmail({
                            event_id: sqlEvent.id as string,
                            buffer_time: organizerSummaryDelay
                        });
                        totalOrganizerSummariesScheduled++;
                        console.log(`[CRON] Scheduled organizer summary email for event ${sqlEvent.id} in ${organizerSummaryDelay}s`);
                    } catch (organizerSummaryError) {
                        console.error(`[CRON] Failed to schedule organizer summary for event ${sqlEvent.id}:`, organizerSummaryError);
                        errors.push(`Failed to schedule organizer summary for event ${sqlEvent.id}`);
                    }
                }

            } catch (eventError) {
                console.error(`[CRON] Error processing event ${sqlEvent.id}:`, eventError);
                errors.push(`Failed to process event ${sqlEvent.id}: ${eventError.message}`);
            }
        }

        const summary = {
            success: true,
            timestamp: new Date().toISOString(),
            eventsProcessed: eventsResult.rows.length,
            remindersScheduled: totalRemindersScheduled,
            externalEmailsScheduled: totalExternalEmailsScheduled,
            organizerSummariesScheduled: totalOrganizerSummariesScheduled,
            errors: errors.length > 0 ? errors : undefined
        };

        console.log('[CRON] Scan complete:', JSON.stringify(summary, null, 2));

        return NextResponse.json(summary);

    } catch (error) {
        console.error('[CRON] Fatal error during cron job execution:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
