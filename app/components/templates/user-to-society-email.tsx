import { EmailPayloadType } from "@/app/lib/types";

const EmailPayload = ({ email, subject, text }: EmailPayloadType) => {
    // Replace newline characters with <br/> to preserve line breaks in HTML
    const formattedText = text.replace(/\n/g, "<br/>");

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>You have a new communication from the LSN:</p>
            <br/>
            <p>Subject: <strong>${subject}</strong></p>
            <p>Sender: <strong>${email}</strong></p>
            <p>Content:</p>
            <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                ${formattedText}
            </div>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;"/>
            <p>Many thanks,</p>
            <p style="margin-left: 20px;">The LSN team</p>
        </div>
    `;
};

export default EmailPayload;
