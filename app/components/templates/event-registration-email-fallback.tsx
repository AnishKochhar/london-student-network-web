import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import { TicketInfo } from "./event-registration-email";

const EventRegistrationEmailFallbackPayload = (
    userName: string,
    event: Event,
    ticketInfo?: TicketInfo
) => {
    const LONDON_TZ = 'Europe/London';

    // Use date-fns-tz for reliable timezone conversion in Node.js
    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'dd/MM/yyyy')
        : event.date;

    const eventTime = event.start_datetime && event.end_datetime
        ? `${formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')} - ${formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')}`
        : event.time;

    return `Hey ${userName}! 👋

Great news! You're officially signed up for "${event.title}". We promise it'll be way more fun than your average Tuesday.

HERE'S WHAT YOU NEED TO KNOW:
📅 When: ${eventDate} at ${eventTime}
📍 Where: ${event.location_building}, ${event.location_area}
${event.location_address ? `         ${event.location_address}` : ''}
${event.capacity ? `👥 Capacity: ${event.capacity} people (and you're one of them!)` : ''}
${ticketInfo ? `
🎟️ YOUR TICKET:
${ticketInfo.ticket_name}${ticketInfo.quantity > 1 ? ` × ${ticketInfo.quantity}` : ''}${parseFloat(ticketInfo.ticket_price) > 0 ? ` - £${(parseFloat(ticketInfo.ticket_price) * ticketInfo.quantity).toFixed(2)}` : ' - FREE'}
` : ''}
📆 ADD TO CALENDAR:
We've attached a calendar file (.ics) to this email. Click on it to automatically add this event to your calendar app (works with Google Calendar, Outlook, Apple Calendar, and more!).

${event.for_externals ? `QUICK HEADS-UP FOR EXTERNAL STUDENTS:
${event.for_externals}

` : ''}Can't wait to see you there! If you have any burning questions (or even lukewarm ones), just reply to this email.

Cheers,
The LSN team

---
Questions? Drop us a line at hello@londonstudentnetwork.com`;
};

export default EventRegistrationEmailFallbackPayload;