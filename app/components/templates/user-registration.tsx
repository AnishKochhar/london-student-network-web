import { Event, Tickets } from "@/app/lib/types";

const UserRegistrationConfirmationEmail = (
  user_name: string,
  eventInformation: Event,
  ticketDetails: Tickets[],
  ticket_to_quantity: Map<string, number>,
  organiser_uid: string
) => {
  const [day, month, year] = eventInformation.date.split('/').map(Number);
  const [start_time, end_time] = eventInformation.time.split(' - ');

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <p>Hey ${user_name},</p>
      <p>Congratulations! You're officially registered for <strong>${eventInformation.title}</strong>. 🎉</p>
      <p>Here's the scoop:</p>
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
      <p>Please find below any important information about this event</p>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Event Description:</strong> ${eventInformation.description}</li>
        <li><strong>Sign up Link:</strong> ${eventInformation.sign_up_link || 'N/A'}</li>
        <li><strong>Information for Externals:</strong> ${eventInformation.for_externals || 'N/A'}</li>
      </ul>
      <p>We can't wait to see you there! If you have any questions or need to chat, just head over to the LSN website and get in touch with the organiser
      at the link here: https://www.londonstudentnetwork.com/societies/society/${organiser_uid} .
      </p>
      <p>Until then, sit back, relax, and start getting excited. This event is gonna be awesome!</p>
      <p>Cheers,</p>
      <p style="margin-left: 20px;">The LSN Team</p>
    </div>
  `;
};

export default UserRegistrationConfirmationEmail;