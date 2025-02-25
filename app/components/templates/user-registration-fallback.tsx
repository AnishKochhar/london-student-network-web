import { EventRegistrationEmail } from "@/app/lib/types";

const UserRegistrationConfirmationEmailFallback = (email: string, eventInformation: EventRegistrationEmail) => {
	return `
Hello ${email},

You're all set! You've successfully registered for "${eventInformation.title}". 🎉

Here are the details:

- Organiser: ${eventInformation.organiser}
- Date: ${eventInformation.day}/${eventInformation.month}/${eventInformation.year}
- Time: ${eventInformation.start_time} - ${eventInformation.end_time}
- Location: ${eventInformation.location_building}, ${eventInformation.location_area}, ${eventInformation.location_address}

We’re super excited to see you there! If you have any questions or need assistance, feel free to contact the organiser through the LSN website.

Until then, get hyped—this event is going to be amazing!

-------------------------
Cheers,
The LSN Team
    `.trim();
};

export default UserRegistrationConfirmationEmailFallback;
