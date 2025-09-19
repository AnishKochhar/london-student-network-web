// Creates a link to /reset-password with token as a query parameter
const ResetEmailPayloadFallback = (email: string, token: string) => {
    const resetLink = `https://londonstudentnetwork.com/reset-password?token=${encodeURIComponent(token)}`;

    return `
Hello ${email}, the moment you've been waiting for has arrived! (Or, the moment since you clicked "Forgot Password."),

You recently requested to reset your password. We all forget out passwords from time to time and we're here to help! Here's your personalised link to reset your password.

To reset your password, please click the following link or paste it into your browser:
${resetLink}

May your new password be strong and your memory even stronger.

If you did not request this, please ignore this email.

-------------------------
Many thanks,
    The LSN team
    `.trim();
};

export default ResetEmailPayloadFallback;
