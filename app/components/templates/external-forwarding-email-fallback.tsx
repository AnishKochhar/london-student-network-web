import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";

interface RegistrationInfo {
    name: string;
    email: string;
    external: boolean;
}

const ExternalForwardingEmailFallbackPayload = (
    event: Event,
    registrations: RegistrationInfo[]
) => {
    const LONDON_TZ = 'Europe/London';

    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    const eventTime = event.start_datetime && event.end_datetime
        ? `${formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')} - ${formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')}`
        : event.time;

    const internalCount = registrations.filter(r => !r.external).length;
    const externalCount = registrations.filter(r => r.external).length;

    return `
Hello,

This is an automated notification regarding the upcoming event at your location:

=== EVENT DETAILS ===

Event: ${event.title}
Organizer: ${event.organiser}

Date: ${eventDate}
Time: ${eventTime}

Location: ${event.location_building}, ${event.location_area}
${event.location_address ? `          ${event.location_address}` : ''}

Total Registrations: ${registrations.length}
  - Internal students: ${internalCount}
  - External students: ${externalCount}
${event.capacity ? `  - Event capacity: ${event.capacity}` : ''}

=== REGISTERED ATTENDEES ===

${registrations.map((reg, index) =>
    `${index + 1}. ${reg.name}
   Email: ${reg.email}
   Type: ${reg.external ? 'External Student' : 'Internal Student'}`
).join('\n\n')}

=== NOTES ===

This list reflects all confirmed registrations as of the time this email was sent.

If you have any questions or concerns, please contact the event organizer: ${event.organiser}

Best regards,
London Student Network

---
This is an automated message from the London Student Network event management system.
For support, contact hello@londonstudentnetwork.com
    `.trim();
};

export default ExternalForwardingEmailFallbackPayload;
