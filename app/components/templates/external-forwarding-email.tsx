import { Event } from "@/app/lib/types";

interface RegistrationInfo {
    name: string;
    email: string;
    external: boolean;
}

const ExternalForwardingEmailPayload = (
    event: Event,
    registrations: RegistrationInfo[]
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

    const internalCount = registrations.filter(r => !r.external).length;
    const externalCount = registrations.filter(r => r.external).length;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>Hello,</p>

            <p>This is an automated notification regarding the upcoming event at your location:</p>

            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #007BFF;">${event.title}</h2>
                <p style="margin: 10px 0;">
                    📅 <strong>Date:</strong> ${eventDate}<br>
                    🕐 <strong>Time:</strong> ${eventTime}<br>
                    📍 <strong>Location:</strong> ${event.location_building}, ${event.location_area}
                    ${event.location_address ? `<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${event.location_address}` : ''}
                </p>
                <p style="margin: 10px 0;">
                    👥 <strong>Total Registrations:</strong> ${registrations.length}<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Internal students: ${internalCount}<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;External students: ${externalCount}
                </p>
            </div>

            <p><strong>Registered Attendees:</strong></p>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #ddd;">
                            <th style="text-align: left; padding: 8px; font-weight: bold;">Name</th>
                            <th style="text-align: left; padding: 8px; font-weight: bold;">Email</th>
                            <th style="text-align: left; padding: 8px; font-weight: bold;">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrations.map((reg, index) => `
                            <tr style="${index % 2 === 0 ? 'background: #fff;' : 'background: #f9f9f9;'}">
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${reg.name}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${reg.email}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${reg.external ? '🌐 External' : '🏛️ Internal'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <p style="background: #fff3cd; padding: 15px; border-left: 3px solid #ffc107; margin: 20px 0;">
                <strong>ℹ️ Note:</strong> This list reflects all confirmed registrations as of the time this email was sent.
                ${event.capacity ? `The event capacity is ${event.capacity} people.` : ''}
            </p>

            <p>If you have any questions or concerns, please contact the event organizer: <strong>${event.organiser}</strong></p>

            <p style="margin-top: 30px;">Best regards,<br>London Student Network</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                This is an automated message from the London Student Network event management system.<br>
                For support, contact <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default ExternalForwardingEmailPayload;
