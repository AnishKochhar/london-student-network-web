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
    return `
NEW CONTACT FORM SUBMISSION
============================

CONTACT DETAILS:
----------------
Name: ${name}
Email: ${email}
${inquiryPurpose ? `Inquiry Purpose: ${inquiryPurpose}` : ''}
${description ? `Description: ${description}` : ''}
${organisation ? `Organisation: ${organisation}` : ''}

MESSAGE:
--------
${message}

============================
Reply to sender: ${email}

This email was sent from the contact form at londonstudentnetwork.com
Timestamp: ${new Date().toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/London'
})}
    `.trim();
};

export default ContactFormEmailFallback;