'use server'

import sendSendGridEmail from './config/private/sendgrid';
import { EmailData } from './types';
import { getEmailFromId } from './data';
import EmailPayload from '../components/templates/user-to-society-email'; // this might have security issues because of user inputs.
import EmailPayloadFallback from '../components/templates/user-to-society-email-fallback';
import ResetEmailPayload from '../components/templates/reset-password';
import ResetEmailPayloadFallback from '../components/templates/reset-password-fallback';
import VerificationEmailPayload from '../components/templates/verification-email';
import VerificationEmailPayloadFallback from '../components/templates/verification-email-fallback';
import UserRegistrationConfirmationEmail from '../components/templates/user-registration';
import UserRegistrationConfirmationEmailFallback from '../components/templates/user-registration-fallback';
import OrganiserRegistrationConfirmationEmailFallback from '../components/templates/organiser-registration-fallback';
import OrganiserRegistrationConfirmationEmail from '../components/templates/organiser-registration';

export const sendOrganiserEmail = async ({ id, email, subject, text }: EmailData) => {
	try {
		const recipient = await getEmailFromId(id);

		if (!recipient.email || recipient.email === '') {
			console.error('Email could not be fetched for the organiser:', id);
			throw new Error('The email for an organiser could not be fetched, after a user triggered a message send');
		}

		const to = recipient.email;
		const customPayload = EmailPayload({ email, subject, text });
		const customPayloadFallback = EmailPayloadFallback({ email, subject, text });

		const msg = {
			to,
			from: 'hello@londonstudentnetwork.com',
			subject: 'New communication from the London Student Network',
			text: customPayloadFallback, // Sendgrid uses text only as a fallback
			html: customPayload,
		};

		await sendSendGridEmail(msg);

	} catch (error) {
		console.error("Error occurred during email sending or fetching logic. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		throw new Error("Failed to send email or an error occurred during the attempt to retrieve organiser email by id");
	}
};

export const sendUserEmail = async ({ toEmail, fromEmail, subject, text }) => {
	try {
		if (!toEmail) {
			console.error('The target email is empty');
			throw new Error('The target email to send is empty');
		}

		const customPayload = EmailPayload({ email: fromEmail, subject, text });
		const customPayloadFallback = EmailPayloadFallback({ email: fromEmail, subject, text });

		const msg = {
			to: toEmail,
			from: 'hello@londonstudentnetwork.com', // question: should we keep this
			subject: 'New communication from the London Student Network',
			text: customPayloadFallback, // Sendgrid uses text only as a fallback
			html: customPayload,
		};

		await sendSendGridEmail(msg);

	} catch (error) {
		console.error("Error occurred during email sending or fetching logic. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		throw new Error("An error occurred during the attempt to retrieve organiser email by id");
	}
};


export const sendResetPasswordEmail = async (email: string, token: string) => {
	try {
		const customPayload = ResetEmailPayload(email, token)
		const customPayloadFallback = ResetEmailPayloadFallback(email, token)

		const msg = {
			to: email,
			from: 'hello@londonstudentnetwork.com',
			subject: '🥁🥁🥁 Reset Password request with the London Student Network 🥁🥁🥁',
			text: customPayloadFallback, // Sendgrid uses text only as a fallback
			html: customPayload,
		};

		await sendSendGridEmail(msg);

	} catch (error) {
		console.error("Error occurred during email sending of reset email. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		throw new Error("Failed to send email to reset password");
	}
}


export const sendEmailVerificationEmail = async (email: string, token: string) => {
	try {
		const customPayload = VerificationEmailPayload(email, token);
		const customPayloadFallback = VerificationEmailPayloadFallback(email, token);

		const msg = {
			to: email,
			from: 'hello@londonstudentnetwork.com',
			subject: '🥁🥁🥁 Verify your email with the London Student Network 🥁🥁🥁',
			text: customPayloadFallback, // Sendgrid uses text only as a fallback,
			html: customPayload,
		};

		await sendSendGridEmail(msg);

	} catch (error) {
		console.error("Error occurred during email sending of verification email. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		throw new Error("Failed to send email to verify email");
	};
}