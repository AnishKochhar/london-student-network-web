import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";

interface RegistrationInfo {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerSummaryEmailFallbackPayload = (
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

    let text = `EVENT REGISTRATION SUMMARY\n\n`;
    text += `Hi there,\n\n`;
    text += `Your event "${event.title}" is happening tomorrow! Here's a complete summary of all registrations.\n\n`;

    text += `EVENT DETAILS\n`;
    text += `Event: ${event.title}\n`;
    text += `Date: ${eventDate}\n`;
    text += `Time: ${eventTime}\n`;
    text += `Location: ${event.location_building}, ${event.location_area}\n`;
    if (event.location_address) {
        text += `Address: ${event.location_address}\n`;
    }
    text += `\n`;

    text += `REGISTRATION STATISTICS\n`;
    text += `Total Registrations: ${registrations.length}`;
    if (event.capacity) {
        text += ` / ${event.capacity}`;
    }
    text += `\n`;
    text += `Internal students: ${internalCount}\n`;
    text += `External students: ${externalCount}\n`;
    text += `\n`;

    if (registrations.length > 0) {
        text += `COMPLETE ATTENDEE LIST\n`;
        text += `${'='.repeat(60)}\n`;
        registrations.forEach((reg, index) => {
            text += `${index + 1}. ${reg.name}\n`;
            text += `   Email: ${reg.email}\n`;
            text += `   Type: ${reg.external ? 'External student' : 'Internal student'}\n`;
            text += `\n`;
        });
    } else {
        text += `No registrations yet for this event.\n\n`;
    }

    if (externalCount > 0) {
        text += `NOTE: You have ${externalCount} external student${externalCount > 1 ? 's' : ''} attending.\n`;
        text += `They may need extra help with:\n`;
        text += `- Campus navigation and building locations\n`;
        text += `- Guest WiFi access\n`;
        text += `- Entry requirements or sign-in procedures\n`;
        text += `\n`;
    }

    text += `QUICK CHECKLIST FOR TOMORROW\n`;
    text += `✓ Venue is booked and ready\n`;
    text += `✓ Materials/equipment prepared\n`;
    text += `✓ Attendee list reviewed\n`;
    text += `✓ Any special arrangements for external students\n`;
    text += `\n`;

    text += `If you need to make any last-minute changes or contact attendees, you can manage everything from your dashboard.\n\n`;
    text += `Best of luck with your event!\n\n`;
    text += `Best regards,\n`;
    text += `London Student Network\n\n`;
    text += `---\n`;
    text += `This is an automated summary sent 24 hours before your event.\n`;
    text += `Questions? Contact us at hello@londonstudentnetwork.com\n`;

    return text;
};

export default EventOrganizerSummaryEmailFallbackPayload;
