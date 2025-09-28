import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { fetchSQLEventById, getEventOrganiserEmail } from "@/app/lib/data";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";
import { sendEventRegistrationEmail } from "@/app/lib/send-email";
import EventRegistrationEmailPayload from "@/app/components/templates/event-registration-email";
import EventRegistrationEmailFallbackPayload from "@/app/components/templates/event-registration-email-fallback";
import EventOrganizerNotificationEmailPayload from "@/app/components/templates/event-organizer-notification-email";
import EventOrganizerNotificationEmailFallbackPayload from "@/app/components/templates/event-organizer-notification-email-fallback";
import { convertSQLEventToEvent } from "@/app/lib/utils";

export async function POST(req: Request) {
	try {
		// Rate limiting for guest registrations
		const identifier = getRateLimitIdentifier(req);
		const rateLimitResult = rateLimit(identifier, rateLimitConfigs.registration);

		if (!rateLimitResult.success) {
			return createRateLimitResponse(rateLimitResult.resetTime);
		}

		const { event_id, firstName, lastName, email } = await req.json();

		// Validate input
		if (!event_id || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
			return NextResponse.json({
				success: false,
				error: "All fields are required",
			});
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({
				success: false,
				error: "Invalid email address",
			});
		}

		// Check if event exists
		const event = await fetchSQLEventById(event_id);
		if (!event) {
			return NextResponse.json({
				success: false,
				error: "Event not found",
			});
		}

		// Check if event has ended
		const now = new Date();
		let eventEndTime: Date;

		if (event.end_datetime) {
			eventEndTime = new Date(event.end_datetime);
		} else {
			// Fallback to constructed datetime if end_datetime is null
			const eventDate = new Date(event.year, event.month - 1, event.day);
			const endTimeString = event.end_time || event.start_time; // Use end_time or fallback to start_time
			const [hours, minutes] = endTimeString.split(':').map(Number);
			eventDate.setHours(hours, minutes, 0, 0);
			eventEndTime = eventDate;
		}

		if (now > eventEndTime) {
			return NextResponse.json({
				success: false,
				error: "This event has already ended. Registration is no longer available.",
			});
		}

		// Check if email is already registered for this event
		const existingRegistration = await sql`
            SELECT event_registration_uuid
            FROM event_registrations
            WHERE event_id = ${event_id} AND email = ${email.toLowerCase()}
        `;

		if (existingRegistration.rows.length > 0) {
			return NextResponse.json({
				success: false,
				alreadyRegistered: true,
				error: "This email is already registered for the event",
			});
		}

		// Register the guest
		const fullName = `${firstName.trim()} ${lastName.trim()}`;

		await sql`
            INSERT INTO event_registrations (
                event_id,
                user_id,
                name,
                email,
                external
            )
            VALUES (
                ${event_id},
                NULL,
                ${fullName},
                ${email.toLowerCase()},
                true
            )
        `;

		// Send confirmation email to guest
		try {
			const eventData = convertSQLEventToEvent(event);
			const guestEmailSubject = `🎉 Registration Confirmed: ${event.title}`;
			const guestEmailHtml = EventRegistrationEmailPayload(firstName, eventData);
			const guestEmailText = EventRegistrationEmailFallbackPayload(firstName, eventData);

			await sendEventRegistrationEmail({
				toEmail: email.toLowerCase(),
				subject: guestEmailSubject,
				html: guestEmailHtml,
				text: guestEmailText,
			});
		} catch (emailError) {
			console.error("Failed to send confirmation email to guest:", emailError);
			// Don't fail the registration if email fails
		}

		// Send notification email to organiser (if not admin and notifications are enabled)
		const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
		if (event.organiser_uid !== ADMIN_ID && event.send_signup_notifications !== false) {
			try {
				const organiserEmail = await getEventOrganiserEmail(event.organiser_uid);

				if (!organiserEmail || !organiserEmail.email || organiserEmail.email === "") {
					console.log(`Warning: Organiser email not found in database for organiser ID: ${event.organiser_uid}`);
					console.log(`Event title: ${event.title}, Organiser name: ${event.organiser}`);
					console.log(`getEventOrganiserEmail returned:`, organiserEmail);
				} else {
					const eventData = convertSQLEventToEvent(event);
					const organiserEmailSubject = `🔔 New Guest Registration: ${event.title}`;
					const organiserEmailHtml = EventOrganizerNotificationEmailPayload(
						eventData,
						{
							name: fullName,
							email: email.toLowerCase(),
							external: true // Guests are always external
						}
					);
					const organiserEmailText = EventOrganizerNotificationEmailFallbackPayload(
						eventData,
						{
							name: fullName,
							email: email.toLowerCase(),
							external: true
						}
					);

					await sendEventRegistrationEmail({
						toEmail: organiserEmail.email,
						subject: organiserEmailSubject,
						html: organiserEmailHtml,
						text: organiserEmailText,
					});
				}
			} catch (organiserEmailError) {
				console.error("Failed to send notification email to organiser:", organiserEmailError);
				// Don't fail the registration if organiser email fails
			}
		}

		return NextResponse.json({
			success: true,
			message: "Successfully registered for event",
		});

	} catch (error) {
		console.error("Error registering guest for event:", error);
		return NextResponse.json({
			success: false,
			error: "Internal server error",
		}, { status: 500 });
	}
}