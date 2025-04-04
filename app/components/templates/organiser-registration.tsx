const OrganiserRegistrationConfirmationEmail = (organiserEmail: string, userEmail: string, userName: string) => {
	return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey ${organiserEmail},</p>
            <p>Good news! Someone just signed up for your event.</p>
            <p>Here are the details:</p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>User Name:</strong> ${userName}</li>
                <li><strong>User Email:</strong> ${userEmail}</li>
            </ul>
            <p>If you need to get in touch with them, feel free to reach out using their email address.</p>
            <p>Thanks for hosting an awesome event! If you need any help managing your registrations, just let us know.</p>
            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN Team</p>
        </div>
    `;
};

export default OrganiserRegistrationConfirmationEmail;
