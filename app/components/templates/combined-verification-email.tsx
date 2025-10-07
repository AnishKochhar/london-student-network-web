// Combined email and university verification email template
const CombinedVerificationEmailPayload = (email: string, token: string, universityName: string) => {
    const verificationLink = `https://londonstudentnetwork.com/verify-combined-email?token=${encodeURIComponent(token)}`;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey there, ${email}!</p>
            <p>Welcome to the London Student Network! We're excited to have you on board. </p>
            <p>So you say you're a ${universityName} student? We believe you (probably). But first, let's verify that this email address belongs to you AND that you're officially part of the ${universityName} crew. </p>
            <p>Click the button below to verify your email and unlock access to exclusive university events:</p>
            <p>
                <a href="${verificationLink}" style="color: #fff; background-color: #007BFF; text-decoration: none; padding: 10px 15px; border-radius: 5px; display: inline-block;">Verify My Email</a>
            </p>
            <p>This single verification will:</p>
            <ul style="color: #333;">
                <li>Confirm your email address</li>
                <li>Verify your ${universityName} student status</li>
                <li>Unlock exclusive university events</li>
            </ul>
            <p>This link expires in 1 hour, so don't procrastinate (we know, easier said than done). </p>
            <p>If you didn't create an account with us, feel free to ignore this email. We'll just assume it was your evil twin. </p>
            <p>Many thanks,</p>
            <p style="margin-left: 20px;">The LSN team</p>
        </div>
    `;
};

export default CombinedVerificationEmailPayload;
