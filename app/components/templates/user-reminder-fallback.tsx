import { Event, Tickets } from "@/app/lib/types";

const UserEventReminderEmailFallback = (
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
    const hoursLeft = Math.round(msDiff / (1000 * 60 * 60));

    return `
        Hey ${user_name},

        Just a quick reminder — the event "${eventInformation.title}" is starting in about ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.

        Here&#39s a refresher on the details:

        - Organiser: ${eventInformation.organiser}
        - Date: ${day}/${month}/${year}
        - Time: ${start_time} - ${end_time}
        - Location: ${eventInformation.location_building}, ${eventInformation.location_area}, ${eventInformation.location_address}

        Your Tickets:
        ${ticketDetails.map(ticketDetail => `- ${ticketDetail.ticket_name} (Quantity: ${ticket_to_quantity[ticketDetail.ticket_uuid]})`).join('\n')}

        Additional Information:
        - Event Description: ${eventInformation.description || 'N/A'}
        - Sign-up Link: ${eventInformation.sign_up_link || 'N/A'}
        - Info for Externals: ${eventInformation.for_externals || 'N/A'}

        If you have any questions before the event, you can reach out to the organiser via:
        https://www.londonstudentnetwork.com/societies/society/${organiser_uid}

        We&#39re looking forward to seeing you there!

            The LSN Team
            `.trim();
        };

export default UserEventReminderEmailFallback;
