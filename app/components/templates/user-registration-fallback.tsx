import { Event, Tickets } from "@/app/lib/types";

const UserRegistrationConfirmationEmailFallback = (
  user_name: string,
  eventInformation: Event,
  ticketDetails: Tickets[],
  ticket_to_quantity: Record<string, number>,
  organiser_uid: string
) => {
    const [day, month, year] = eventInformation.date.split('/').map(Number);
    const [start_time, end_time] = eventInformation.time.split(' - ');
	return `
Hello ${user_name},

You're all set! You've successfully registered for "${eventInformation.title}". 🎉

Here are the details:

- Organiser: ${eventInformation.organiser}
- Date: ${day}/${month}/${year}
- Time: ${start_time} - ${end_time}
- Location: ${eventInformation.location_building}, ${eventInformation.location_area}, ${eventInformation.location_address}
- Ticket Details:
${ticketDetails.map(td => `  * ${td.ticket_name}: ${ticket_to_quantity[td.ticket_uuid]}`).join('\n')}

Please find below any important information about this event.

- Event Description: ${eventInformation.description}
- Sign up Link:</strong> ${eventInformation.sign_up_link || 'N/A'}
- Information for Externals:</strong> ${eventInformation.for_externals || 'N/A'}


We are super excited to see you there! If you have any questions or need assistance, feel free to contact the organiser through the LSN website, or
through the link here: https://www.londonstudentnetwork.com/societies/society/${organiser_uid} .

Until then, get hyped — this event is going to be amazing!

-------------------------
Cheers,
The LSN Team
    `.trim();
};

export default UserRegistrationConfirmationEmailFallback;
