"use server";

import sendSendGridEmail from "./config/private/sendgrid";
import { EmailData, Event } from "./types";
import { getEmailFromId } from "./data";
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
            from: "hello@londonstudentnetwork.com", // question: should we keep this
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
    text
}: {
    toEmail: string;
    subject: string;
    html: string;
    text: string;
}) => {
    try {
        if (!toEmail) {
            console.error("The target email is empty");
            throw new Error("The target email to send is empty");
        }

        const msg = {
            to: toEmail,
            from: "hello@londonstudentnetwork.com",
            subject: subject,
            html: html,  // Primary HTML content
            text: text,  // Fallback plain text
        };

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
}: {
    externalEmail: string;
    event: Event;
    registrations: Array<{ name: string; email: string; external: boolean }>;
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

        const htmlPayload = ExternalForwardingEmailPayload(event, registrations);
        const textPayload = ExternalForwardingEmailFallbackPayload(event, registrations);

        const msg = {
            to: externalEmail,
            from: "hello@londonstudentnetwork.com",
            subject: `📋 Registration List: ${event.title}`,
            html: htmlPayload,
            text: textPayload,
        };

        await sendSendGridEmail(msg);

        console.log(`External forwarding email sent to ${externalEmail} for event ${event.id}`);
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
