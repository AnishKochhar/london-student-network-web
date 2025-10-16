// Combined verification email fallback (plain text)
const CombinedVerificationEmailPayloadFallback = (
    email: string,
    token: string,
    universityName: string,
) => {
    const verificationLink = `https://londonstudentnetwork.com/verify-combined-email?token=${encodeURIComponent(token)}`;

    return `
Hey there, ${email}!

Welcome to the London Student Network! We're excited to have you on board.

So you say you're a ${universityName} student? We believe you (probably). But first, let's verify that this email address belongs to you AND that you're officially part of the ${universityName} crew.

Click the link below to verify your email and unlock access to exclusive university events:

${verificationLink}

This single verification will:
- Confirm your email address
- Verify your ${universityName} student status
- Unlock exclusive university events

This link expires in 1 hour, so don't procrastinate (we know, easier said than done).

If you didn't create an account with us, feel free to ignore this email. We'll just assume it was your evil twin.

Many thanks,
The LSN team
    `;
};

export default CombinedVerificationEmailPayloadFallback;
