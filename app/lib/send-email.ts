import { sendEmail } from './singletons-private';
import { EmailData, Event, Tickets } from './types';
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
import OrganiserEventReminderEmail from '../components/templates/organiser-reminder';
import OrganiserEventReminderEmailFallback from '../components/templates/organiser-reminder-fallback';
import UserEventReminderEmail from '../components/templates/user-reminder';
import UserEventReminderEmailFallback from '../components/templates/user-reminder-fallback';
import { UserEmailReminderInterface } from './types/emails';
// import { FallbackEmailServiceResponse } from './types/emails';
import { fetchEventById } from './data';


export const sendOrganiserEmail = async ({ id, email, subject, text }: EmailData) => {
	try {
		const recipient = await getEmailFromId(id);

		try {
			if (!recipient.email || recipient.email === '') {
				console.error('Email could not be fetched for the organiser:', id);
				throw new Error('The email for an organiser could not be fetched, after a user triggered a message send');
			}

			const to = recipient.email;
			const customPayload = EmailPayload({ email, subject, text });
			const customPayloadFallback = EmailPayloadFallback({ email, subject, text });

			const msg = {
				to,
				// from: 'hello@londonstudentnetwork.com',
				subject: 'New communication from the London Student Network',
				text: customPayloadFallback, // Sendgrid uses text only as a fallback
				html: customPayload,
			};

			await sendEmail(msg);
		} catch(error) {
			console.error("Error occurred during email sending or fetching logic. Error message:", error.message);
			console.error("Stack trace:", error.stack);
			throw new Error("LSN email services failed. Please try again later.");
		}

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
			// from: 'hello@londonstudentnetwork.com',
			subject: '🥁🥁🥁 Reset Password request with the London Student Network 🥁🥁🥁',
			text: customPayloadFallback, // Sendgrid uses text only as a fallback
			html: customPayload,
		};

		await sendEmail(msg);

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
			// from: 'hello@londonstudentnetwork.com',
			subject: '🥁🥁🥁 Verify your email with the London Student Network 🥁🥁🥁',
			text: customPayloadFallback, // Sendgrid uses text only as a fallback,
			html: customPayload,
		};

		await sendEmail(msg);
		return { success: true };

	} catch (error) {
		console.error("Error occurred during email sending of verification email. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		// throw new Error("Failed to send email to verify email");
		return { success: false };
	};
}

export const sendUserRegistrationEmail = async (email: string, user_name: string, event: Event, ticketDetails: Tickets[], ticket_to_quantity: Record<string, number>, organiser_uid: string) => {
	try {
		const customPayload = UserRegistrationConfirmationEmail(user_name, event, ticketDetails, ticket_to_quantity, organiser_uid);
		const customPayloadFallback = UserRegistrationConfirmationEmailFallback(user_name, event, ticketDetails, ticket_to_quantity, organiser_uid);

		const msg = {
			to: email, 
			// from: 'hello@londonstudentnetwork.com',
			subject: `🧧 Tickets for ${event.title}`,
			text: customPayloadFallback, 
			html: customPayload,
		};

		await sendEmail(msg);
		return { success: true };

	} catch (error) {
		console.error("Error occurred during email sending of registration email. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		return { success: false };

		// throw new Error("Failed to send email to verify email");
	}
}

export const sendOrganiserRegistrationEmail = async (organiserEmail: string, userEmail: string, userName: string, eventTitle: string) => {
	try {
		const customPayload = OrganiserRegistrationConfirmationEmail(organiserEmail, userEmail, userName)
		const customPayloadFallback = OrganiserRegistrationConfirmationEmailFallback(organiserEmail, userEmail, userName)

		const msg = {
			to: organiserEmail, 
			// from: 'hello@londonstudentnetwork.com',
			subject: `🧧 New registration for ${eventTitle}`, 
			text: customPayloadFallback, 
			html: customPayload,
		}

		await sendEmail(msg);
		return { success: true };

	} catch (error) {
		console.error("Error occurred during email sending of registration email. Error message:", error.message);
		console.error("Stack trace:", error.stack);

		return { success: false };
	}
}

export const sendUserReminderEmail = async ({email, user_name, event, ticketDetails, ticket_to_quantity, organiser_uid } : UserEmailReminderInterface ) => {
	try {
		const customPayload = UserEventReminderEmail(user_name, event, ticketDetails, ticket_to_quantity, organiser_uid);
		const customPayloadFallback = UserEventReminderEmailFallback(user_name, event, ticketDetails, ticket_to_quantity, organiser_uid);

		const msg = {
			to: email, 
			// from: 'hello@londonstudentnetwork.com',
			subject: `🔔⏰ Don't forget - ${event.title} starts soon`,
			text: customPayloadFallback, 
			html: customPayload,
		};

		await sendEmail(msg);
		return { success: true };

	} catch (error) {
		console.error("Error occurred during email sending of reminder email (for user). Error message:", error.message);
		console.error("Stack trace:", error.stack);

		throw new Error("error with event email reminder sending (for user)")
	}
}

export const sendOrganiserReminderEmail = async (organiserEmail: string, eventId: string ) => {
	try {
		const response = await fetchEventById(eventId);
		if (!response.success) {
			throw new Error();
		}
		const eventTitle = response.event.title;
		const eventStartTime = response.event.time
		const eventStartDate = response.event.date

		try {
			const customPayload = OrganiserEventReminderEmail(organiserEmail, eventTitle, eventStartTime, eventStartDate)
			const customPayloadFallback = OrganiserEventReminderEmailFallback(organiserEmail, eventTitle, eventStartTime, eventStartDate)

			const msg = {
				to: organiserEmail, 
				// from: 'hello@londonstudentnetwork.com',
				subject: `⏳⏳⏳ Event reminder for ${eventTitle}`, 
				text: customPayloadFallback, 
				html: customPayload,
			}

			await sendEmail(msg);
			return { success: true };

		} catch (error) {
			console.error("Error occurred during email sending of reminder email (for organiser). Error message:", error.message);
			console.error("Stack trace:", error.stack);

			throw new Error("error with event email reminder sending (for organiser)")
		}
	} catch(error) {
		console.error("Error occurred during event start time retrieval for reminder email (for organiser). Error message:", error.message);
		console.error("Stack trace:", error.stack);

		throw new Error("error with fetchEventById call, during event email reminder sending (for organiser)")
	}
}
