const VerificationEmailPayloadFallback = (email: string, token: string) => {
    const verificationLink = `https://londonstudentnetwork.com/verify-email?token=${encodeURIComponent(token)}`;

    return `
Hey ${email},

We're not gonna lie, we're kinda suspicious of you. You just signed up for the LSN, but did you really mean it? Are you a robot? A cat? A mischievous squirrel? We need proof!

To prove you're a real human (or at least, not a toaster pretending to be one), please copy and paste the following link into your web browser:

${verificationLink}

This link is like a magic spell, but it only works once. Don't lose it! (Or do, and then you'll have to start all over again. Oops.)

If you didn't sign up for anything, just ignore this email. We'll blame it on a rogue AI.

-------------------------
Many thanks,
    The LSN team
    `.trim();
};

export default VerificationEmailPayloadFallback;
