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

    return `Hi ${userName} 👋

🎉 Thank you for registering for "${event.title}"!

EVENT DETAILS
=============
📅 Date: ${eventDate}
⏰ Time: ${eventTime}
📍 Location: ${event.location_building}
             ${event.location_area}
             ${event.location_address}
${event.capacity ? `👥 Capacity: ${event.capacity} attendees` : ''}

${event.for_externals ? `📋 INFORMATION FOR EXTERNAL STUDENTS
${event.for_externals}

` : ''}We look forward to seeing you there! 🌟

Best regards,
The London Student Network Team

---
If you have any questions, please contact us at hello@londonstudentnetwork.com`;
};

export default EventRegistrationEmailFallbackPayload;