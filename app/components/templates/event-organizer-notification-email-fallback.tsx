import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import { TicketInfo } from "./event-registration-email";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

interface RegistrationDetails {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerNotificationEmailFallbackPayload = (
    event: Event,
    registration: RegistrationDetails,
    ticketInfo?: TicketInfo
) => {
    const LONDON_TZ = 'Europe/London';

    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'dd/MM/yyyy')
        : event.date;

    const manageUrl = `https://londonstudentnetwork.com/events/${base16ToBase62(event.id)}/manage`;

    return `🎉 SOMEONE JUST SIGNED UP FOR YOUR EVENT!

Good news! ${registration.name} has registered for "${event.title}" (${eventDate}).

HERE'S WHAT YOU NEED TO KNOW:
👤 Name: ${registration.name}
📧 Email: ${registration.email}
🏫 Type: ${registration.external ? 'External student' : 'Internal student'}
${ticketInfo ? `🎟️ Ticket: ${ticketInfo.ticket_name}${ticketInfo.quantity > 1 ? ` × ${ticketInfo.quantity}` : ''}${parseFloat(ticketInfo.ticket_price) > 0 ? ` (£${(parseFloat(ticketInfo.ticket_price) * ticketInfo.quantity).toFixed(2)})` : ' (FREE)'}` : ''}

${registration.external ? `📝 NOTE: This is an external student, so they might need additional information about campus access or directions.

` : ''}MANAGE YOUR EVENT
View all registrations, manage attendees, and update event details:
${manageUrl}

If you need to contact this attendee directly, just reply to this email!

Cheers,
The LSN team

---
Questions? Drop us a line at hello@londonstudentnetwork.com`;
};

export default EventOrganizerNotificationEmailFallbackPayload;