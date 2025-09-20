import { EmailPayloadType } from "@/app/lib/types";

const EmailPayloadFallback = ({ email, subject, text }: EmailPayloadType) => {
    return `
You have a new communication from the LSN:

Subject: ${subject}

Sender: ${email}

Content:
${text}

-------------------------
Many thanks,
    The LSN team
    `.trim();
};

export default EmailPayloadFallback;
