import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";

interface RegistrationDetails {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerNotificationEmailPayload = (
    event: Event,
    registration: RegistrationDetails
) => {
    const LONDON_TZ = 'Europe/London';

    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>🎉 <strong>Someone just signed up for your event!</strong></p>

            <p>Good news! ${registration.name} has registered for <strong>"${event.title}"</strong> (${eventDate}).</p>

            <p><strong>Here's what you need to know:</strong></p>

            <p style="margin-left: 20px;">
                👤 <strong>Name:</strong> ${registration.name}<br>
                📧 <strong>Email:</strong> <a href="mailto:${registration.email}" style="color: #007BFF;">${registration.email}</a><br>
                🏫 <strong>Type:</strong> ${registration.external ? 'External student' : 'Internal student'}
            </p>

            ${registration.external ? `
            <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #ffc107; margin: 20px 0;">
                <strong>📝 Note:</strong> This is an external student, so they might need additional information about campus access or directions.
            </p>
            ` : ''}

            <p>You can manage all your registrations through your account dashboard. If you need to contact them directly, just hit reply!</p>

            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Drop us a line at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventOrganizerNotificationEmailPayload;