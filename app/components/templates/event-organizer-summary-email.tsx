import { Event } from "@/app/lib/types";

interface RegistrationInfo {
    name: string;
    email: string;
    external: boolean;
}

const EventOrganizerSummaryEmailPayload = (
    event: Event,
    registrations: RegistrationInfo[]
) => {
    const eventDate = event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Europe/London'
        })
        : event.date;

    const eventTime = event.start_datetime
        ? new Date(event.start_datetime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London'
        })
        : event.time;

    const internalCount = registrations.filter(r => !r.external).length;
    const externalCount = registrations.filter(r => r.external).length;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007BFF;">📊 Event Registration Summary</h2>

            <p>Hi there,</p>

            <p>Your event "<strong>${event.title}</strong>" is happening tomorrow! Here's a complete summary of all registrations.</p>

            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #007BFF;">${event.title}</h3>
                <p style="margin: 10px 0;">
                    📅 <strong>Date:</strong> ${eventDate}<br>
                    🕐 <strong>Time:</strong> ${eventTime}<br>
                    📍 <strong>Location:</strong> ${event.location_building}, ${event.location_area}
                    ${event.location_address ? `<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${event.location_address}` : ''}
                </p>
                <p style="margin: 10px 0;">
                    👥 <strong>Total Registrations:</strong> ${registrations.length}
                    ${event.capacity ? ` / ${event.capacity}` : ''}<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Internal students: ${internalCount}<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;External students: ${externalCount}
                </p>
            </div>

            ${registrations.length > 0 ? `
            <p><strong>Complete Attendee List:</strong></p>

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
                                <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${reg.email}" style="color: #007BFF;">${reg.email}</a></td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${reg.external ? '🌐 External' : '🏛️ Internal'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : `
            <p style="background: #fff3cd; padding: 15px; border-left: 3px solid #ffc107; margin: 20px 0;">
                <strong>ℹ️ Note:</strong> No registrations yet for this event.
            </p>
            `}

            ${externalCount > 0 ? `
            <p style="background: #e8f4fd; padding: 15px; border-left: 3px solid #007BFF; margin: 20px 0;">
                <strong>💡 Tip:</strong> You have ${externalCount} external student${externalCount > 1 ? 's' : ''} attending. They may need extra help with:
                <ul style="margin: 10px 0;">
                    <li>Campus navigation and building locations</li>
                    <li>Guest WiFi access</li>
                    <li>Entry requirements or sign-in procedures</li>
                </ul>
            </p>
            ` : ''}

            <p style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>📋 Quick checklist for tomorrow:</strong><br>
                ✓ Venue is booked and ready<br>
                ✓ Materials/equipment prepared<br>
                ✓ Attendee list reviewed<br>
                ✓ Any special arrangements for external students
            </p>

            <p>If you need to make any last-minute changes or contact attendees, you can manage everything from your dashboard.</p>

            <p>Best of luck with your event!</p>

            <p style="margin-top: 30px;">Best regards,<br>London Student Network</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                This is an automated summary sent 24 hours before your event.<br>
                Questions? Contact us at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventOrganizerSummaryEmailPayload;
