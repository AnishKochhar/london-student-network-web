import { Event } from "@/app/lib/types";

const EventRegistrationEmailFallbackPayload = (
    userName: string,
    event: Event
) => {
    const eventDate = event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-GB')
        : event.date;

    const eventTime = event.start_datetime
        ? new Date(event.start_datetime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        })
        : event.time;

    return `Hey ${userName}! 👋

Great news! You're officially signed up for "${event.title}". We promise it'll be way more fun than your average Tuesday.

HERE'S WHAT YOU NEED TO KNOW:
📅 When: ${eventDate} at ${eventTime}
📍 Where: ${event.location_building}, ${event.location_area}
${event.location_address ? `         ${event.location_address}` : ''}
${event.capacity ? `👥 Capacity: ${event.capacity} people (and you're one of them!)` : ''}

${event.for_externals ? `QUICK HEADS-UP FOR EXTERNAL STUDENTS:
${event.for_externals}

` : ''}Can't wait to see you there! If you have any burning questions (or even lukewarm ones), just reply to this email.

Cheers,
The LSN team

---
Questions? Drop us a line at hello@londonstudentnetwork.com`;
};

export default EventRegistrationEmailFallbackPayload;