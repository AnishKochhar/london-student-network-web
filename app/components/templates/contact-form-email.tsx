interface ContactFormEmailProps {
    name: string;
    email: string;
    message: string;
    inquiryPurpose?: string;
    description?: string;
    organisation?: string;
}

const ContactFormEmail = ({
    name,
    email,
    message,
    inquiryPurpose,
    description,
    organisation
}: ContactFormEmailProps): string => {
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>📬 <strong>New message from the contact form!</strong></p>

            <p>Someone's trying to get in touch. Here's what they said:</p>

            <p style="margin-left: 20px;">
                <strong>👤 Name:</strong> ${name}<br>
                <strong>📧 Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a><br>
                ${inquiryPurpose ? `<strong>🎯 Purpose:</strong> ${inquiryPurpose}<br>` : ''}
                ${organisation ? `<strong>🏢 Organisation:</strong> ${organisation}<br>` : ''}
                ${description ? `<strong>📝 Description:</strong> ${description}<br>` : ''}
            </p>

            <p><strong>Their message:</strong></p>
            <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #007BFF; margin: 20px 0; white-space: pre-wrap; word-wrap: break-word;">
                ${message}
            </p>

            <p>
                <a href="mailto:${email}" style="color: #fff; background-color: #007BFF; text-decoration: none; padding: 10px 15px; border-radius: 5px; display: inline-block;">Reply to ${name}</a>
            </p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Sent from londonstudentnetwork.com on ${new Date().toLocaleString('en-GB', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'Europe/London'
                })}
            </p>
        </div>
    `.trim();
};

export default ContactFormEmail;