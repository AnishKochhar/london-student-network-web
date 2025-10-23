import { Event } from "@/app/lib/types";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import { formatInTimeZone } from "date-fns-tz";

const EventCreationConfirmationEmailFallbackPayload = (event: Event) => {
    const LONDON_TZ = 'Europe/London';

    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    const eventStartTime = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')
        : event.time;

    const eventEndTime = event.end_datetime
        ? formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')
        : '';

    const accessLabels = {
        'public': 'Open to everyone',
        'students_only': 'Requires account login',
        'verified_students': 'Verified students only',
        'university_exclusive': 'University-exclusive'
    };

    const visibilityLabel = accessLabels[event.visibility_level as keyof typeof accessLabels] || event.visibility_level;
    const registrationLabel = accessLabels[event.registration_level as keyof typeof accessLabels] || event.registration_level;

    // Generate event URL
    const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com'}/events/${base16ToBase62(event.id)}`;

    return `🎉 YOUR EVENT IS LIVE!

Hi there,

Congratulations! ${event.title} is now live and visible to students on London Student Network.

EVENT DETAILS
=============
Title: ${event.title}
Date: ${eventDate}
Time: ${eventStartTime}${eventEndTime ? ` - ${eventEndTime}` : ''}
Location: ${event.location_building}, ${event.location_area}${event.location_address ? `\n          ${event.location_address}` : ''}
${event.capacity ? `Capacity: ${event.capacity} attendees\n` : ''}${visibilityLabel === registrationLabel ? `Access: ${registrationLabel}` : `Visibility: ${visibilityLabel}\nRegistration: ${registrationLabel}`}

${event.registration_cutoff_hours ? `REGISTRATION CUTOFF
===================
Registrations close ${event.registration_cutoff_hours} hour${event.registration_cutoff_hours > 1 ? 's' : ''} before the event starts.

` : ''}WHAT HAPPENS NEXT?
==================
${event.send_signup_notifications !== false ? `* Instant notifications – You'll receive an email for each registration.\n` : ''}* 24-hour summary – Full attendee list sent 24 hours before the event.
${event.external_forward_email ? `* External forwarding – Registration list sent to ${event.external_forward_email}.\n` : ''}* Attendee reminders – All attendees get a reminder 3 hours before.

${event.for_externals ? `💡 HOSTING EXTERNAL STUDENTS?
Consider including campus directions, guest WiFi details, and entry requirements in your event description.

` : ''}You can edit details, view registrations, and manage everything from your event page.

View your event: ${eventUrl}

Good luck with your event! 🎉

Best regards,
London Student Network

Questions? Contact us at hello@londonstudentnetwork.com
`;
};

export default EventCreationConfirmationEmailFallbackPayload;
