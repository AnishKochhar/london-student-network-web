import { Event } from "@/app/lib/types";

interface RegistrationDetails {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerNotificationEmailPayload = (
    event: Event,
    registration: RegistrationDetails
) => {
    const eventDate = event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : event.date;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a95ff 0%, #0056b3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Event Registration</h1>
            </div>

            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>

                <p style="font-size: 16px; margin-bottom: 25px;">
                    A new ${registration.external ? 'external' : 'internal'} attendee has registered for your event <strong>"${event.title}"</strong>.
                </p>

                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0a95ff; margin-bottom: 25px;">
                    <h2 style="color: #0a95ff; margin-top: 0; font-size: 20px;">Registration Details</h2>

                    <p style="margin: 10px 0;">
                        <strong>👤 Name:</strong> ${registration.name}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>📧 Email:</strong>
                        <a href="mailto:${registration.email}" style="color: #0a95ff;">${registration.email}</a>
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>🏫 Registration Type:</strong>
                        <span style="display: inline-block; padding: 4px 8px; background: ${registration.external ? '#ffc107' : '#28a745'}; color: white; border-radius: 4px; font-size: 12px;">
                            ${registration.external ? 'External Student' : 'Internal Student'}
                        </span>
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>📅 Event Date:</strong> ${eventDate}
                    </p>
                </div>

                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                    <p style="margin: 5px 0; color: #0056b3;">
                        <strong>💡 Tip:</strong> You can manage all your event registrations through your account dashboard.
                    </p>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    Best regards,<br>
                    <strong>The London Student Network Team</strong><br>
                    <a href="mailto:hello@londonstudentnetwork.com" style="color: #0a95ff;">hello@londonstudentnetwork.com</a>
                </p>
            </div>
        </div>
    `;
};

export default EventOrganizerNotificationEmailPayload;