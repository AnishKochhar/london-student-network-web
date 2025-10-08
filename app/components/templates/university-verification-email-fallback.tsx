// University email verification email template (plain text fallback)
const UniversityVerificationEmailPayloadFallback = (email: string, token: string, universityName: string) => {
    const verificationLink = `https://londonstudentnetwork.com/verify-university-email?token=${encodeURIComponent(token)}`;

    return `
Hey there, ${email}!

So you say you're a ${universityName} student? We believe you (probably). But just to be extra sure you're not a rogue squirrel with a fake student ID, we need you to verify that uni email!

Please copy and paste the following link into your web browser to verify your university email:

${verificationLink}

Once verified, you'll unlock access to exclusive university events and connect with fellow students from ${universityName}. Pretty cool, right?

This link expires in 1 hour, so don't procrastinate (we know, easier said than done).

If you didn't request this verification, feel free to ignore this email. We'll just assume it was your evil twin.

-------------------------
Many thanks,
    The LSN team
    `.trim();
};

export default UniversityVerificationEmailPayloadFallback;
