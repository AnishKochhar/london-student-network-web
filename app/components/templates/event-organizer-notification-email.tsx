import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import { TicketInfo } from "./event-registration-email";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

interface RegistrationDetails {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerNotificationEmailPayload = (
    event: Event,
    registration: RegistrationDetails,
    ticketInfo?: TicketInfo
) => {
    const LONDON_TZ = 'Europe/London';

    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    const manageUrl = `https://londonstudentnetwork.com/events/${base16ToBase62(event.id)}/manage`;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>🎉 <strong>Someone just signed up for your event!</strong></p>

            <p>Good news! ${registration.name} has registered for <strong>"${event.title}"</strong> (${eventDate}).</p>

            <p><strong>Here's what you need to know:</strong></p>

            <p style="margin-left: 20px;">
                👤 <strong>Name:</strong> ${registration.name}<br>
                📧 <strong>Email:</strong> <a href="mailto:${registration.email}" style="color: #007BFF;">${registration.email}</a><br>
                🏫 <strong>Type:</strong> ${registration.external ? 'External student' : 'Internal student'}
                ${ticketInfo ? `<br>🎟️ <strong>Ticket:</strong> ${ticketInfo.ticket_name}${ticketInfo.quantity > 1 ? ` × ${ticketInfo.quantity}` : ''}${parseFloat(ticketInfo.ticket_price) > 0 ? ` (£${(parseFloat(ticketInfo.ticket_price) * ticketInfo.quantity).toFixed(2)})` : ' (FREE)'}` : ''}
            </p>

            ${registration.external ? `
            <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #ffc107; margin: 20px 0;">
                <strong>📝 Note:</strong> This is an external student, so they might need additional information about campus access or directions.
            </p>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${manageUrl}" style="display: inline-block; background: #007BFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    📊 Manage Event
                </a>
            </div>

            <p>View all registrations, manage attendees, and update event details from your event management page. If you need to contact this attendee directly, just hit reply!</p>

            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Drop us a line at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventOrganizerNotificationEmailPayload;