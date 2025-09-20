// Creates a link to /reset-password with token as a query parameter
const ResetEmailPayload = (email: string, token: string) => {
    const resetLink = `https://londonstudentnetwork.com/reset-password?token=${encodeURIComponent(token)}`;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hello ${email}, the moment you've been waiting for has arrived! (Or, the moment since you clicked "Forgot Password.")</p>
            <p>You recently requested to <strong>reset your password</strong>. We all forget out passwords from time to time and we're here to help! Here's your personalised link to reset your password.</p>
            <p>
                <a href="${resetLink}" style="color: #fff; background-color: #007BFF; text-decoration: none; padding: 10px 15px; border-radius: 5px; display: inline-block;">Reset Your Password</a>
            </p>
			<p>Use this link wisely, for with great password-resetting power comes great responsibility. (Okay, maybe not, but still.)</p>
			<p>May your new password be strong and your memory even stronger.</p>
			<p>If the above link does not work, just copy/paste this link into your browser: <a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Many thanks,</p>
            <p style="margin-left: 20px;">The LSN team</p>
        </div>
    `;
};

export default ResetEmailPayload;
