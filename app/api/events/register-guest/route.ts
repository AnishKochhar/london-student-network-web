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
				error: "EVENT_ENDED|This event has ended",
			});
		}

		// ===== ACCESS CONTROL FOR GUEST REGISTRATION =====
		// Guest registration is ONLY allowed for public events
		const registrationLevel = event.registration_level || 'public';

		if (registrationLevel !== 'public') {
			// For any restricted event (students_only, verified_students, university_exclusive),
			// guests cannot register - they must create an account
			return NextResponse.json({
				success: false,
				error: "ACCOUNT_REQUIRED|Please log in or sign up to register",
			});
		}

		// Check registration cutoff (general cutoff only - no external cutoff for guests)
		if (event.registration_cutoff_hours != null && event.registration_cutoff_hours > 0) {
			let eventStartTime: Date;

			if (event.start_datetime) {
				eventStartTime = new Date(event.start_datetime);
			} else {
				const eventDate = new Date(event.year, event.month - 1, event.day);
				const [hours, minutes] = event.start_time.split(':').map(Number);
				eventDate.setHours(hours, minutes, 0, 0);
				eventStartTime = eventDate;
			}

			const cutoffTime = new Date(eventStartTime.getTime() - event.registration_cutoff_hours * 60 * 60 * 1000);
			if (now >= cutoffTime) {
				return NextResponse.json({
					success: false,
					error: "REGISTRATION_CLOSED|Registration has closed",
				});
			}
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

		// Determine if guest is internal based on email domain
		// Internal = guest's email university matches event organizer's university
		let isInternal = false;

		try {
			const emailDomain = email.toLowerCase().split('@')[1];

			if (emailDomain) {
				// Query to check if email domain matches organizer's university
				const universityCheckResult = await sql`
					SELECT
						ued.university_name,
						si.university_affiliation as organizer_university
					FROM university_email_domains ued
					CROSS JOIN users u
					LEFT JOIN society_information si ON u.id = si.user_id
					WHERE u.id = ${event.organiser_uid}
					  AND ued.email_domain = ${emailDomain}
					  AND ued.is_active = true
					  AND si.university_affiliation IS NOT NULL
					  AND si.university_affiliation = ued.university_name
				`;

				// If domain is recognized AND matches organizer's university → internal
				if (universityCheckResult.rows.length > 0) {
					const row = universityCheckResult.rows[0];
					isInternal = true;

					if (isInternal) {
						console.log(`[GUEST-REG] Guest ${email} recognized as internal (${row.university_name})`);
					}
				}
			}
		} catch (universityCheckError) {
			console.error('[GUEST-REG] Error checking university status:', universityCheckError);
			// Default to external on error (safe fallback)
			isInternal = false;
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
                ${!isInternal}
            )
        `;

		// Fetch organizer email once for use in both emails
		let organiserEmailAddress: string | undefined;
		try {
			const organiserEmail = await getEventOrganiserEmail(event.organiser_uid);
			organiserEmailAddress = organiserEmail?.email;
		} catch (err) {
			console.error("Failed to fetch organiser email:", err);
		}

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
				replyTo: organiserEmailAddress, // Reply to organizer
			});
		} catch (emailError) {
			console.error("Failed to send confirmation email to guest:", emailError);
			// Don't fail the registration if email fails
		}

		// Send notification email to organiser (if not admin and notifications are enabled)
		const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
		if (event.organiser_uid !== ADMIN_ID && event.send_signup_notifications !== false) {
			try {
				if (!organiserEmailAddress || organiserEmailAddress === "") {
					console.log(`Warning: Organiser email not found in database for organiser ID: ${event.organiser_uid}`);
					console.log(`Event title: ${event.title}, Organiser name: ${event.organiser}`);
				} else {
					const eventData = convertSQLEventToEvent(event);
					const organiserEmailSubject = `🔔 New Guest Registration: ${event.title}`;
					const organiserEmailHtml = EventOrganizerNotificationEmailPayload(
						eventData,
						{
							name: fullName,
							email: email.toLowerCase(),
							external: !isInternal
						}
					);
					const organiserEmailText = EventOrganizerNotificationEmailFallbackPayload(
						eventData,
						{
							name: fullName,
							email: email.toLowerCase(),
							external: !isInternal
						}
					);

					await sendEventRegistrationEmail({
						toEmail: organiserEmailAddress,
						subject: organiserEmailSubject,
						html: organiserEmailHtml,
						text: organiserEmailText,
						replyTo: email.toLowerCase(), // Reply to the guest
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