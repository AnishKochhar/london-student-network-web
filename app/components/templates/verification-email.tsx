// Creates a link to /reset-password with token as a query parameter
const VerificationEmailPayload = (email: string, token: string) => {
    const verificationLink = `https://londonstudentnetwork.com/verify-email?token=${encodeURIComponent(token)}`;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey ${email},</p>
            <p>We're not gonna lie, we're kinda suspicious of you. You just signed up for the LSN, but did you really mean it? Are you a robot? A cat? A mischievous squirrel? We need proof!</p>
            <p>To prove you're a real human (or at least, not a toaster pretending to be one), please click the button below. It's like a secret handshake, but way cooler. </p>
            <p>
                <a href="${verificationLink}" style="color: #fff; background-color: #007BFF; text-decoration: none; padding: 10px 15px; border-radius: 5px; display: inline-block;">Verify your email</a>
            </p>
            <p>This link is like a magic spell, but it only works once. Don't lose it! (Or do, and then you'll have to start all over again. Oops.)</p>
            <p>If you didn't sign up for anything, just ignore this email. We'll blame it on a rogue AI. </p>
            <p>Many thanks,</p>
            <p style="margin-left: 20px;">The LSN team</p>
        </div>      
    `;
};

export default VerificationEmailPayload;
