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
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>Hey ${userName}! 👋</p>

            <p>Great news! You're officially signed up for <strong>${event.title}</strong>. We promise it'll be way more fun than your average Tuesday.</p>

            <p><strong>Here's what you need to know:</strong></p>

            <p style="margin-left: 20px;">
                📅 <strong>When:</strong> ${eventDate} at ${eventTime}<br>
                📍 <strong>Where:</strong> ${event.location_building}, ${event.location_area}<br>
                ${event.location_address ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${event.location_address}<br>` : ''}
                ${event.capacity ? `👥 <strong>Capacity:</strong> ${event.capacity} people (and you're one of them!)` : ''}
            </p>

            ${event.for_externals ? `
            <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #007BFF; margin: 20px 0;">
                <strong>Quick heads-up for external students:</strong><br>
                ${event.for_externals}
            </p>
            ` : ''}

            <p>Can't wait to see you there! If you have any burning questions (or even lukewarm ones), just hit reply.</p>

            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Drop us a line at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventRegistrationEmailPayload;