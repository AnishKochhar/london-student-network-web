import { EventRegistrationEmail } from "@/app/lib/types";

const UserRegistrationConfirmationEmail = (email: string, eventInformation: EventRegistrationEmail) => {
	return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey ${email},</p>
            <p>Congratulations! You're officially registered for <strong>${eventInformation.title}</strong>. 🎉</p>
            <p>Here's the scoop:</p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Organiser:</strong> ${eventInformation.organiser}</li>
                <li><strong>Date:</strong> ${eventInformation.day}/${eventInformation.month}/${eventInformation.year}</li>
                <li><strong>Time:</strong> ${eventInformation.start_time} - ${eventInformation.end_time}</li>
                <li><strong>Location:</strong> ${eventInformation.location_building}, ${eventInformation.location_area}, ${eventInformation.location_address}</li>
            </ul>
            <p>We can't wait to see you there! If you have any questions or need to chat, just head over to the LSN website and get in touch with the organiser.</p>
            <p>Until then, sit back, relax, and start getting excited. This event is gonna be awesome!</p>
            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN Team</p>
        </div>
    `;
};

export default UserRegistrationConfirmationEmail;
