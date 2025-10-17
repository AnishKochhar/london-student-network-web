import { Event } from "@/app/lib/types";

interface RegistrationDetails {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerNotificationEmailFallbackPayload = (
    event: Event,
    registration: RegistrationDetails
) => {
    const eventDate = event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-GB', {
            timeZone: 'Europe/London'
        })
        : event.date;

    return `🎉 SOMEONE JUST SIGNED UP FOR YOUR EVENT!

Good news! ${registration.name} has registered for "${event.title}" (${eventDate}).

HERE'S WHAT YOU NEED TO KNOW:
👤 Name: ${registration.name}
📧 Email: ${registration.email}
🏫 Type: ${registration.external ? 'External student' : 'Internal student'}

${registration.external ? `📝 NOTE: This is an external student, so they might need additional information about campus access or directions.

` : ''}You can manage all your registrations through your account dashboard. If you need to contact them directly, just reply to this email!

Cheers,
The LSN team

---
Questions? Drop us a line at hello@londonstudentnetwork.com`;
};

export default EventOrganizerNotificationEmailFallbackPayload;