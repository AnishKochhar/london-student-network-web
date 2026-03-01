import { Event } from "@/app/lib/types";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import { formatInTimeZone } from "date-fns-tz";

const EventCreationConfirmationEmailPayload = (event: Event) => {
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

    // Access control labels - simplified
    const accessLabels = {
        'public': 'Open to everyone',
        'students_only': 'Requires account login',
        'verified_students': 'Verified students only',
        'university_exclusive': 'University-exclusive',
        'private': 'Private (link-only)'
    };

    const visibilityLabel = accessLabels[event.visibility_level as keyof typeof accessLabels] || event.visibility_level;
    const registrationLabel = accessLabels[event.registration_level as keyof typeof accessLabels] || event.registration_level;

    // Generate event URL
    const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com'}/events/${base16ToBase62(event.id)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com';

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981; margin-bottom: 5px;">🎉 Your Event is Live!</h2>

            <p>Hi there,</p>

            <p>Congratulations! <strong>${event.title}</strong> is now live and visible to students on <a href="${baseUrl}" style="color: #007BFF; text-decoration: none;">London Student Network</a>.</p>

            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #007BFF;">${event.title}</h3>
                <p style="margin: 10px 0;">
                    📅 <strong>Date:</strong> ${eventDate}<br>
                    🕐 <strong>Time:</strong> ${eventStartTime}${eventEndTime ? ` - ${eventEndTime}` : ''}<br>
                    📍 <strong>Location:</strong> ${event.location_building}, ${event.location_area}
                    ${event.location_address ? `<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${event.location_address}` : ''}
                </p>
                ${event.capacity ? `
                <p style="margin: 10px 0;">
                    👥 <strong>Capacity:</strong> ${event.capacity} attendees
                </p>
                ` : ''}
                ${visibilityLabel === registrationLabel ? `
                <p style="margin: 10px 0;">
                    🎟️ <strong>Access:</strong> ${registrationLabel}
                </p>
                ` : `
                <p style="margin: 10px 0;">
                    🔍 <strong>Visibility:</strong> ${visibilityLabel}<br>
                    🎟️ <strong>Registration:</strong> ${registrationLabel}
                </p>
                `}
            </div>

            ${event.registration_cutoff_hours ? `
            <div style="background: #fff3cd; padding: 15px; border-left: 3px solid #ffc107; margin: 20px 0; border-radius: 4px;">
                <strong>⏰ Registration Cutoff:</strong> Registrations close ${event.registration_cutoff_hours} hour${event.registration_cutoff_hours > 1 ? 's' : ''} before the event starts.
            </div>
            ` : ''}

            <h3 style="color: #007BFF; margin-top: 30px;">What happens next?</h3>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ${event.send_signup_notifications !== false ? `
                <p style="margin: 10px 0;">
                    📬 <strong>Instant notifications</strong> – You'll receive an email for each registration.
                </p>
                ` : ''}
                <p style="margin: 10px 0;">
                    📊 <strong>24-hour summary</strong> – Full attendee list sent 24 hours before the event.
                </p>
                ${event.external_forward_email ? `
                <p style="margin: 10px 0;">
                    📧 <strong>External forwarding</strong> – Registration list sent to <strong>${event.external_forward_email}</strong>.
                </p>
                ` : ''}
                <p style="margin: 10px 0;">
                    🔔 <strong>Attendee reminders</strong> – All attendees get a reminder 3 hours before.
                </p>
            </div>

            ${event.for_externals ? `
            <div style="background: #e8f4fd; padding: 15px; border-left: 3px solid #007BFF; margin: 20px 0; border-radius: 4px;">
                <strong>💡 Hosting external students?</strong> Consider including campus directions, guest WiFi details, and entry requirements in your event description.
            </div>
            ` : ''}

            <p style="text-align: center; margin: 30px 0;">
                <a href="${eventUrl}"
                   style="display: inline-block; background: #007BFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Your Event
                </a>
            </p>

            <p style="color: #666; font-size: 14px;">You can edit details, view registrations, and manage everything from your event page.</p>

            <p>Good luck with your event! 🎉</p>

            <p style="margin-top: 30px;">Best regards,<br>London Student Network</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Contact us at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventCreationConfirmationEmailPayload;
