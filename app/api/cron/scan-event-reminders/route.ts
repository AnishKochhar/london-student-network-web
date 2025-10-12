import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { scheduleEventEmailReminder } from '@/app/lib/functions/events/schedule-event-email-reminder';
import { sendExternalForwardingEmail } from '@/app/lib/send-email';
import { convertSQLEventToEvent } from '@/app/lib/utils';
import { SQLEvent } from '@/app/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('Unauthorized cron job access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[CRON] Starting event reminder scan at ${new Date().toISOString()}`);

        // Find events starting in the next 24 hours (with 1 hour buffer)
        const now = new Date();
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

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
            WHERE start_datetime BETWEEN ${in23Hours.toISOString()} AND ${in25Hours.toISOString()}
            AND is_deleted = false
            AND is_hidden = false
        `;

        console.log(`[CRON] Found ${eventsResult.rows.length} events starting in 24 hours`);

        let totalRemindersScheduled = 0;
        let totalExternalEmailsSent = 0;
        const errors: string[] = [];

        // Process each event
        for (const sqlEvent of eventsResult.rows) {
            try {
                console.log(`[CRON] Processing event: ${sqlEvent.title} (${sqlEvent.id})`);

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

                // Schedule reminder emails for each registered user
                for (const registration of registrationsResult.rows) {
                    try {
                        await scheduleEventEmailReminder({
                            user_id: registration.user_id,
                            event_id: sqlEvent.id as string,
                            attempts: 0,
                            buffer_time: 3600 // Send in 1 hour from now
                        });
                        totalRemindersScheduled++;
                    } catch (reminderError) {
                        console.error(`[CRON] Failed to schedule reminder for user ${registration.user_id}:`, reminderError);
                        errors.push(`Failed to schedule reminder for user ${registration.user_id} in event ${sqlEvent.id}`);
                    }
                }

                // Send external forwarding email if configured
                if (sqlEvent.external_forward_email && sqlEvent.external_forward_email.trim() !== '') {
                    try {
                        const event = convertSQLEventToEvent(sqlEvent as SQLEvent);

                        const registrationsList = registrationsResult.rows.map(reg => ({
                            name: reg.name as string,
                            email: reg.email as string,
                            external: reg.external as boolean
                        }));

                        await sendExternalForwardingEmail({
                            externalEmail: sqlEvent.external_forward_email as string,
                            event,
                            registrations: registrationsList
                        });

                        totalExternalEmailsSent++;
                        console.log(`[CRON] Sent external forwarding email for event ${sqlEvent.id} to ${sqlEvent.external_forward_email}`);
                    } catch (externalEmailError) {
                        console.error(`[CRON] Failed to send external email for event ${sqlEvent.id}:`, externalEmailError);
                        errors.push(`Failed to send external email for event ${sqlEvent.id}`);
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
            externalEmailsSent: totalExternalEmailsSent,
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
