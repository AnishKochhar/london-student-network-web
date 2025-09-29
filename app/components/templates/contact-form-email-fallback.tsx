interface ContactFormEmailFallbackProps {
    name: string;
    email: string;
    message: string;
    inquiryPurpose?: string;
    description?: string;
    organisation?: string;
}

const ContactFormEmailFallback = ({
    name,
    email,
    message,
    inquiryPurpose,
    description,
    organisation
}: ContactFormEmailFallbackProps): string => {
    return `📬 NEW MESSAGE FROM THE CONTACT FORM!

Someone's trying to get in touch. Here's what they said:

CONTACT INFO:
👤 Name: ${name}
📧 Email: ${email}
${inquiryPurpose ? `🎯 Purpose: ${inquiryPurpose}` : ''}
${organisation ? `🏢 Organisation: ${organisation}` : ''}
${description ? `📝 Description: ${description}` : ''}

THEIR MESSAGE:
${message}

---
Reply to: ${email}

Sent from londonstudentnetwork.com on ${new Date().toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/London'
})}
    `.trim();
};

export default ContactFormEmailFallback;