import { Event, Tickets } from "@/app/lib/types";

const UserEventReminderEmail = (
    user_name: string,
    eventInformation: Event,
    ticketDetails: Tickets[],
    ticket_to_quantity: Record<string, number>,
    organiser_uid: string
) => {
    const [day, month, year] = eventInformation.date.split('/').map(Number);
    const [start_time, end_time] = eventInformation.time.split(' - ');

    const [hour, minute] = start_time.split(':').map(Number);

    const eventDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const msDiff = eventDate.getTime() - now.getTime();
    const hoursLeft = Math.round(msDiff / (1000 * 60 * 60)); // Round to nearest hour

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey ${user_name},</p>
            <p>Just a quick reminder — the event <strong>${eventInformation.title}</strong> is starting in about ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}</p>
            <p>Here&#39s a refresher on the details:</p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Organiser:</strong> ${eventInformation.organiser}</li>
                <li><strong>Date:</strong> ${day}/${month}/${year}</li>
                <li><strong>Time:</strong> ${start_time} - ${end_time}</li>
                <li><strong>Location:</strong> ${eventInformation.location_building}, ${eventInformation.location_area}, ${eventInformation.location_address}</li>
                <li><strong>Your Tickets:</strong>
                    <ul>
                        ${ticketDetails.map(ticketDetail => `
                            <li>${ticketDetail.ticket_name} - Quantity: ${ticket_to_quantity[ticketDetail.ticket_uuid]}</li>
                        `).join('')}
                    </ul>
                </li>
            </ul>
            <p>Additional event information:</p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Event Description:</strong> ${eventInformation.description || 'N/A'}</li>
                <li><strong>Sign up Link:</strong> ${eventInformation.sign_up_link || 'N/A'}</li>
                <li><strong>Information for Externals:</strong> ${eventInformation.for_externals || 'N/A'}</li>
            </ul>
            <p>
                Got questions before the big day? Reach out to the organiser via the LSN website:
                <a href="https://www.londonstudentnetwork.com/societies/society/${organiser_uid}" style="color: #1a73e8;">View Organiser Profile</a>
            </p>
            <p>We&#39re looking forward to seeing you there. Don&#39t forget to bring your energy and enthusiasm!</p>
            <p>All the best,</p>
            <p style="margin-left: 20px;">The LSN Team</p>
        </div>
    `;
};

export default UserEventReminderEmail;
