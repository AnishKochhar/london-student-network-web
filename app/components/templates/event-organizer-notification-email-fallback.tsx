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
        ? new Date(event.start_datetime).toLocaleDateString('en-GB')
        : event.date;

    return `Hello 👋

🔔 A new ${registration.external ? 'external' : 'internal'} attendee has registered for your event "${event.title}".

REGISTRATION DETAILS
====================
👤 Name: ${registration.name}
📧 Email: ${registration.email}
🏫 Type: ${registration.external ? 'External Student' : 'Internal Student'}
📅 Event Date: ${eventDate}

💡 You can manage your event registrations through your account dashboard.

Best regards,
The London Student Network Team

---
If you have any questions, please contact us at hello@londonstudentnetwork.com`;
};

export default EventOrganizerNotificationEmailFallbackPayload;