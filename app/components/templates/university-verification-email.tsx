// University email verification email template
const UniversityVerificationEmailPayload = (email: string, token: string, universityName: string) => {
    const verificationLink = `https://londonstudentnetwork.com/verify-university-email?token=${encodeURIComponent(token)}`;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey there, ${email}!</p>
            <p>So you say you're a ${universityName} student? We believe you (probably). But just to be extra sure you're not a rogue squirrel with a fake student ID, we need you to verify that uni email! </p>
            <p>Click the shiny button below to confirm that you really do check your university emails (unlike most students, let's be honest). </p>
            <p>
                <a href="${verificationLink}" style="color: #fff; background-color: #007BFF; text-decoration: none; padding: 10px 15px; border-radius: 5px; display: inline-block;">Verify University Email</a>
            </p>
            <p>Once verified, you'll unlock access to exclusive university events and connect with fellow students from ${universityName}. Pretty cool, right?</p>
            <p>This link expires in 1 hour, so don't procrastinate (we know, easier said than done). </p>
            <p>If you didn't request this verification, feel free to ignore this email. We'll just assume it was your evil twin. </p>
            <p>Many thanks,</p>
            <p style="margin-left: 20px;">The LSN team</p>
        </div>
    `;
};

export default UniversityVerificationEmailPayload;
