"use server";

import {
    DefaultEmailPayloadType,
    FallbackEmailServiceResponse,
} from "../../types/emails";

import sgMail from "@sendgrid/mail";

// ================================
// sendgrid initialization
// ================================

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
    console.error("SendGrid API key is missing!");
    throw new Error("SENDGRID_API_KEY environment variable not set");
}

sgMail.setApiKey(SENDGRID_API_KEY); // sgMail setup is light and will likely not be required repeatedly, so just re-attach always

// Function to send an email (exported as a server action), with a custom fallback email service
export default async function sendSendGridEmail({
    to,
    from,
    subject,
    text,
    html,
}: DefaultEmailPayloadType) {
    if (!text && !html) {
        throw new Error("At least one of 'text' or 'html' must be provided.");
    }

    const msg = {
        to,
        from,
        subject,
        ...(text && { text }),
        ...(html && { html }),
    };

    try {
        await sgMail.send(msg);
        return { success: true };
    } catch (sendGridError) {
        // SendGrid failed, attempting fallback
        try {
            const response = await requestFallbackEmailService({
                to: msg.to as string,
                subject: msg.subject,
                ...(text && { text }),
                ...(html && { html }),
            });

            if (!response.success) {
                throw new Error(
                    `LSN fallback email service failed: ${response.error}`,
                );
            }

            return { success: true };
        } catch (fallbackError) {
            console.error("Both SendGrid and fallback service failed");
            console.error("SendGrid error:", sendGridError.message);
            console.error("Fallback error:", fallbackError.message);

            // Return the most relevant error to the user
            if (fallbackError.message.includes("Unauthorized")) {
                throw new Error(
                    "Email services unavailable: Authentication failed for both primary and backup services",
                );
            }
            throw new Error(
                `Failed to send email: Primary service - ${sendGridError.message}, Fallback service - ${fallbackError.message}`,
            );
        }
    }
}

export const requestFallbackEmailService = async (emailData: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}): Promise<FallbackEmailServiceResponse> => {
    try {
        const response = await fetch(
            "https://email-sender-gules.vercel.app/api/send-email",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.EMAIL_FALLBACK_SERVICE_SECURITY_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: emailData.to,
                    subject: emailData.subject,
                    text: emailData.text,
                    html: emailData.html,
                }),
            },
        );

        const result: FallbackEmailServiceResponse = await response.json();

        return result;
    } catch (error) {
        console.error("[Fallback Service Failure]:", error.message);
        throw new Error(`Fallback service failed: ${error.message}`);
    }
};
