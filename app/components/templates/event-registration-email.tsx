import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";

export interface TicketInfo {
    ticket_name: string;
    ticket_price: string;
    quantity: number;
}

const EventRegistrationEmailPayload = (
    userName: string,
    event: Event,
    ticketInfo?: TicketInfo
) => {
    const LONDON_TZ = 'Europe/London';

    // Use date-fns-tz for reliable timezone conversion in Node.js
    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    const eventTime = event.start_datetime && event.end_datetime
        ? `${formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')} - ${formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')}`
        : event.time;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>Hey ${userName}! 👋</p>

            <p>Great news! You're officially signed up for <strong>${event.title}</strong>. We promise it'll be way more fun than your average Tuesday.</p>

            <p><strong>Here's what you need to know:</strong></p>

            <p style="margin-left: 20px;">
                📅 <strong>When:</strong> ${eventDate} at ${eventTime}<br>
                📍 <strong>Where:</strong> ${event.location_building}, ${event.location_area}<br>
                ${event.location_address ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${event.location_address}<br>` : ''}
                ${event.capacity ? `👥 <strong>Capacity:</strong> ${event.capacity} people (and you're one of them!)` : ''}
            </p>

            ${ticketInfo ? `
            <p style="background: #f0f9ff; padding: 15px; border-left: 3px solid #3b82f6; margin: 20px 0;">
                <strong>🎟️ Your Ticket:</strong><br>
                <span style="font-size: 16px; margin-top: 8px; display: block;">
                    ${ticketInfo.ticket_name}${ticketInfo.quantity > 1 ? ` × ${ticketInfo.quantity}` : ''}
                    ${parseFloat(ticketInfo.ticket_price) > 0 ? ` - £${(parseFloat(ticketInfo.ticket_price) * ticketInfo.quantity).toFixed(2)}` : ' - FREE'}
                </span>
            </p>
            ` : ''}

            <p style="background: #e8f4fd; padding: 15px; border-left: 3px solid #007BFF; margin: 20px 0;">
                <strong>📆 Add to Calendar:</strong> We've attached a calendar file (.ics) to this email. Click on it to automatically add this event to your calendar app (works with Google Calendar, Outlook, Apple Calendar, and more!).
            </p>

            ${event.for_externals ? `
            <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #007BFF; margin: 20px 0;">
                <strong>Quick heads-up for external students:</strong><br>
                ${event.for_externals}
            </p>
            ` : ''}

            <p>Can't wait to see you there! If you have any burning questions (or even lukewarm ones), just hit reply.</p>

            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Drop us a line at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventRegistrationEmailPayload;