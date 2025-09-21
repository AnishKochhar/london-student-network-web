import { Event } from "@/app/lib/types";

const EventRegistrationEmailPayload = (
    userName: string,
    event: Event
) => {
    const eventDate = event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : event.date;

    const eventTime = event.start_datetime
        ? new Date(event.start_datetime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        })
        : event.time;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Registration Confirmed!</h1>
            </div>

            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>

                <p style="font-size: 16px; margin-bottom: 25px;">
                    You're all set! You've successfully registered for <strong>${event.title}</strong>.
                </p>

                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 25px;">
                    <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">Event Details</h2>

                    <p style="margin: 10px 0;">
                        <strong>📅 Date:</strong> ${eventDate}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>⏰ Time:</strong> ${eventTime}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>📍 Location:</strong><br>
                        ${event.location_building}<br>
                        ${event.location_area}<br>
                        ${event.location_address}
                    </p>

                    ${event.capacity ? `
                    <p style="margin: 10px 0;">
                        <strong>👥 Capacity:</strong> ${event.capacity} attendees
                    </p>
                    ` : ''}
                </div>

                ${event.for_externals ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
                    <h3 style="color: #856404; margin-top: 0; font-size: 16px;">📋 Information for External Students</h3>
                    <p style="color: #856404; margin: 5px 0;">${event.for_externals}</p>
                </div>
                ` : ''}

                <p style="font-size: 16px; margin-bottom: 20px;">
                    We're looking forward to seeing you there! If you have any questions, feel free to reach out.
                </p>

                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    Best regards,<br>
                    <strong>The London Student Network Team</strong><br>
                    <a href="mailto:hello@londonstudentnetwork.com" style="color: #667eea;">hello@londonstudentnetwork.com</a>
                </p>
            </div>
        </div>
    `;
};

export default EventRegistrationEmailPayload;