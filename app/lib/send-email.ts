"use server";

import sendSendGridEmail from "./config/private/sendgrid";
import { EmailData, Event } from "./types";
import { getEmailFromId } from "./data";

interface EmailMessage {
    to: string;
    from: string;
    replyTo?: string;
    subject: string;
    text: string;
    html: string;
    attachments?: Array<{
        content: string;
        filename: string;
        type: string;
        disposition: string;
    }>;
}
import EmailPayload from "../components/templates/user-to-society-email"; // this might have security issues because of user inputs.
import EmailPayloadFallback from "../components/templates/user-to-society-email-fallback";
import ResetEmailPayload from "../components/templates/reset-password";
import ResetEmailPayloadFallback from "../components/templates/reset-password-fallback";
import VerificationEmailPayload from "../components/templates/verification-email";
import VerificationEmailPayloadFallback from "../components/templates/verification-email-fallback";
import UniversityVerificationEmailPayload from "../components/templates/university-verification-email";
import UniversityVerificationEmailPayloadFallback from "../components/templates/university-verification-email-fallback";
import CombinedVerificationEmailPayload from "../components/templates/combined-verification-email";
import CombinedVerificationEmailPayloadFallback from "../components/templates/combined-verification-email-fallback";
import ExternalForwardingEmailPayload from "../components/templates/external-forwarding-email";
import ExternalForwardingEmailFallbackPayload from "../components/templates/external-forwarding-email-fallback";

export const sendOrganiserEmail = async ({
    id,
    email,
    subject,
    text,
}: EmailData) => {
    try {
        const recipient = await getEmailFromId(id);

        if (!recipient.email || recipient.email === "") {
            console.error("Email could not be fetched for the organiser:", id);
            throw new Error(
                "The email for an organiser could not be fetched, after a user triggered a message send",
            );
        }

        const to = recipient.email;
        const customPayload = await EmailPayload({ email, subject, text });
        const customPayloadFallback = EmailPayloadFallback({
            email,
            subject,
            text,
        });

        const msg = {
            to,
            from: "hello@londonstudentnetwork.com",
            replyTo: email, // Reply to the user who sent the message
            subject: "New communication from the London Student Network",
            text: customPayloadFallback, // Sendgrid uses text only as a fallback
            html: customPayload,
        };

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during email sending or fetching logic. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error(
            "Failed to send email or an error occurred during the attempt to retrieve organiser email by id",
        );
    }
};

export const sendUserEmail = async ({ toEmail, fromEmail, subject, text }) => {
    try {
        if (!toEmail) {
            console.error("The target email is empty");
            throw new Error("The target email to send is empty");
        }

        const customPayload = await EmailPayload({ email: fromEmail, subject, text });
        const customPayloadFallback = EmailPayloadFallback({
            email: fromEmail,
            subject,
            text,
        });

        const msg = {
            to: toEmail,
            from: "hello@londonstudentnetwork.com",
            replyTo: fromEmail, // Reply to the user who sent the message
            subject: "New communication from the London Student Network",
            text: customPayloadFallback, // Sendgrid uses text only as a fallback
            html: customPayload,
        };

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during email sending or fetching logic. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error(
            "An error occurred during the attempt to retrieve organiser email by id",
        );
    }
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
    try {
        const customPayload = ResetEmailPayload(email, token);
        const customPayloadFallback = ResetEmailPayloadFallback(email, token);

        const msg = {
            to: email,
            from: "hello@londonstudentnetwork.com",
            subject:
                "🥁🥁🥁 Reset Password request with the London Student Network 🥁🥁🥁",
            text: customPayloadFallback, // Sendgrid uses text only as a fallback
            html: customPayload,
        };

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during email sending of reset email. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error("Failed to send email to reset password");
    }
};

export const sendEmailVerificationEmail = async (
    email: string,
    token: string,
) => {
    try {
        const customPayload = VerificationEmailPayload(email, token);
        const customPayloadFallback = VerificationEmailPayloadFallback(
            email,
            token,
        );

        const msg = {
            to: email,
            from: "hello@londonstudentnetwork.com",
            subject:
                "🥁🥁🥁 Verify your email with the London Student Network 🥁🥁🥁",
            text: customPayloadFallback, // Sendgrid uses text only as a fallback,
            html: customPayload,
        };

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during email sending of verification email. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error("Failed to send email to verify email");
    }
};

export const sendEventRegistrationEmail = async ({
    toEmail,
    subject,
    html,
    text,
    replyTo,
    icsAttachment
}: {
    toEmail: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
    icsAttachment?: {
        content: string;
        filename: string;
    };
}) => {
    try {
        if (!toEmail) {
            console.error("The target email is empty");
            throw new Error("The target email to send is empty");
        }

        const msg: EmailMessage = {
            to: toEmail,
            from: "hello@londonstudentnetwork.com",
            ...(replyTo && { replyTo }), // Include replyTo if provided
            subject: subject,
            html: html,  // Primary HTML content
            text: text,  // Fallback plain text
        };

        // Add ICS attachment if provided
        if (icsAttachment) {
            msg.attachments = [
                {
                    content: Buffer.from(icsAttachment.content).toString('base64'),
                    filename: icsAttachment.filename,
                    type: 'text/calendar; method=REQUEST',
                    disposition: 'attachment',
                }
            ];
        }

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during event registration email sending. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error(
            "An error occurred during the attempt to send event registration email",
        );
    }
};

export const sendUniversityVerificationEmail = async (
    email: string,
    token: string,
    universityName: string,
) => {
    try {
        const customPayload = UniversityVerificationEmailPayload(email, token, universityName);
        const customPayloadFallback = UniversityVerificationEmailPayloadFallback(
            email,
            token,
            universityName,
        );

        const msg = {
            to: email,
            from: "hello@londonstudentnetwork.com",
            subject: `Verify your ${universityName} email - London Student Network`,
            text: customPayloadFallback,
            html: customPayload,
        };

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during university verification email sending. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error("Failed to send university verification email");
    }
};

export const sendCombinedVerificationEmail = async (
    email: string,
    token: string,
    universityName: string,
) => {
    try {
        const customPayload = CombinedVerificationEmailPayload(email, token, universityName);
        const customPayloadFallback = CombinedVerificationEmailPayloadFallback(
            email,
            token,
            universityName,
        );

        const msg = {
            to: email,
            from: "hello@londonstudentnetwork.com",
            subject: `Verify your email and ${universityName} account - London Student Network`,
            text: customPayloadFallback,
            html: customPayload,
        };

        await sendSendGridEmail(msg);
    } catch (error) {
        console.error(
            "Error occurred during combined verification email sending. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error("Failed to send combined verification email");
    }
};

export const sendExternalForwardingEmail = async ({
    externalEmail,
    event,
    registrations,
    organizerEmail,
    namesOnly = true,
}: {
    externalEmail: string;
    event: Event;
    registrations: Array<{ name: string; email: string; external: boolean }>;
    organizerEmail?: string;
    namesOnly?: boolean;
}) => {
    try {
        if (!externalEmail) {
            console.error("External forwarding email address is empty");
            throw new Error("External forwarding email address is required");
        }

        if (!registrations || registrations.length === 0) {
            console.log(`No registrations to forward for event ${event.id}`);
            return { success: true, message: "No registrations to forward" };
        }

        const htmlPayload = ExternalForwardingEmailPayload(event, registrations, namesOnly);
        const textPayload = ExternalForwardingEmailFallbackPayload(event, registrations, namesOnly);

        // Send to external email with organizer CC'd
        const msg: EmailMessage = {
            to: externalEmail,
            from: "hello@londonstudentnetwork.com",
            ...(organizerEmail && { replyTo: organizerEmail }), // Reply to organizer
            subject: `📋 Attendee List: ${event.title}`,
            html: htmlPayload,
            text: textPayload,
        };

        await sendSendGridEmail(msg);
        console.log(`External forwarding email sent to ${externalEmail} for event ${event.id}`);

        // Send confirmation to organizer with full details as backup
        if (organizerEmail) {
            try {
                const confirmationHtml = ExternalForwardingEmailPayload(event, registrations, false); // Full details
                const confirmationText = ExternalForwardingEmailFallbackPayload(event, registrations, false);

                const confirmationMsg: EmailMessage = {
                    to: organizerEmail,
                    from: "hello@londonstudentnetwork.com",
                    subject: `✓ Attendee List Sent: ${event.title}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: #e8f5e9; padding: 16px; border-radius: 6px; border-left: 3px solid #4caf50; margin-bottom: 24px;">
                                <p style="margin: 0; font-weight: 600; color: #2e7d32;">✓ Attendee list sent successfully</p>
                                <p style="margin: 8px 0 0 0; font-size: 13px; color: #555;">We've sent the attendee names to ${externalEmail}</p>
                            </div>
                            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                                Below is the complete list with contact details for your records. If the external contact needs more information, they can reach out to you directly.
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                            ${confirmationHtml}
                        </div>
                    `,
                    text: `✓ ATTENDEE LIST SENT SUCCESSFULLY

We've sent the attendee names to ${externalEmail}

Below is the complete list with contact details for your records:

${confirmationText}`,
                };

                await sendSendGridEmail(confirmationMsg);
                console.log(`Confirmation email sent to organizer ${organizerEmail} for event ${event.id}`);
            } catch (confirmError) {
                console.error("Error sending confirmation to organizer:", confirmError);
                // Don't fail the main operation if confirmation fails
            }
        }

        return { success: true };
    } catch (error) {
        console.error(
            "Error occurred during external forwarding email sending. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error(
            "An error occurred during the attempt to send external forwarding email",
        );
    }
};

export const sendEventReportEmail = async ({
    eventTitle,
    eventId,
    eventUrl,
    reporterName,
    reporterEmail,
    reporterUserId,
    reason,
    additionalDetails,
    reportId,
}: {
    eventTitle: string;
    eventId: string;
    eventUrl: string;
    reporterName?: string;
    reporterEmail?: string;
    reporterUserId?: string;
    reason: string;
    additionalDetails?: string;
    reportId: string;
}) => {
    try {
        const reporterInfo = reporterUserId
            ? `Logged in user (ID: ${reporterUserId})`
            : `Guest: ${reporterName} (${reporterEmail})`;

        const htmlPayload = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #1f2937; font-size: 18px; margin-bottom: 10px; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 15px; }
        .detail { margin-bottom: 10px; }
        .label { font-weight: 600; color: #4b5563; }
        .value { color: #1f2937; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Event Report Received</h1>
        </div>
        <div class="content">
            <div class="section">
                <h2>Event Information</h2>
                <div class="info-box">
                    <div class="detail">
                        <span class="label">Event Title:</span>
                        <span class="value">${eventTitle}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Event ID:</span>
                        <span class="value">${eventId}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Event URL:</span>
                        <a href="${eventUrl}">${eventUrl}</a>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Reporter Information</h2>
                <div class="info-box">
                    <div class="detail">
                        <span class="value">${reporterInfo}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Report Details</h2>
                <div class="info-box">
                    <div class="detail">
                        <span class="label">Report ID:</span>
                        <span class="value">${reportId}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Reason:</span>
                        <span class="value">${reason}</span>
                    </div>
                    ${additionalDetails ? `
                    <div class="detail">
                        <span class="label">Additional Details:</span><br>
                        <span class="value">${additionalDetails}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
                Please review this report and take appropriate action. You can view the event and manage reports through the admin dashboard.
            </p>
        </div>
        <div class="footer">
            <p>London Student Network - Event Moderation System</p>
        </div>
    </div>
</body>
</html>
        `;

        const textPayload = `
🚨 EVENT REPORT RECEIVED

EVENT INFORMATION
-----------------
Event Title: ${eventTitle}
Event ID: ${eventId}
Event URL: ${eventUrl}

REPORTER INFORMATION
-------------------
${reporterInfo}

REPORT DETAILS
--------------
Report ID: ${reportId}
Reason: ${reason}
${additionalDetails ? `Additional Details: ${additionalDetails}` : ''}

Please review this report and take appropriate action.

---
London Student Network - Event Moderation System
        `;

        const msg = {
            to: "hello@londonstudentnetwork.com",
            from: "hello@londonstudentnetwork.com",
            ...(reporterEmail && { replyTo: reporterEmail }), // Reply to reporter if available
            subject: `🚨 Event Report: ${eventTitle}`,
            html: htmlPayload,
            text: textPayload,
        };

        await sendSendGridEmail(msg);

        console.log(`Event report email sent for event ${eventId} (Report ID: ${reportId})`);
        return { success: true };
    } catch (error) {
        console.error(
            "Error occurred during event report email sending. Error message:",
            error.message,
        );
        console.error("Stack trace:", error.stack);

        throw new Error(
            "An error occurred during the attempt to send event report email",
        );
    }
};
