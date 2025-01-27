const OrganiserRegistrationConfirmationEmailFallback = (organiserEmail: string, userEmail: string, userName: string) => {
	return `
Hello ${organiserEmail},

Good news! Someone just signed up for your event.

Here are their details:
- User Name: ${userName}
- User Email: ${userEmail}

If you need to get in touch with them, you can reach out using their email address.

Thanks for hosting such an awesome event! If you need any help managing registrations, feel free to reach out to us.

-------------------------
Cheers,
The LSN Team
    `.trim();
};

export default OrganiserRegistrationConfirmationEmailFallback;
