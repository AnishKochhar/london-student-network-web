import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { fetchSQLEventById, getEmailFromId } from "@/app/lib/data";
import { sendUserEmail } from "@/app/lib/send-email";

export async function POST(req: Request) {
	try {
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
			const guestEmailSubject = `🎉 Registration Confirmed: ${event.title}`;
			const guestEmailText = `Hi ${firstName},

Thank you for registering for "${event.title}"!

Event Details:
📅 Date: ${new Date(event.start_datetime).toLocaleDateString()}
⏰ Time: ${new Date(event.start_datetime).toLocaleTimeString()}
📍 Location: ${event.location_building}, ${event.location_area}

We look forward to seeing you there!

Best regards,
The London Student Network Team

---
If you have any questions, please contact us at hello@londonstudentnetwork.com`;

			await sendUserEmail({
				toEmail: email.toLowerCase(),
				fromEmail: "hello@londonstudentnetwork.com",
				subject: guestEmailSubject,
				text: guestEmailText,
			});
		} catch (emailError) {
			console.error("Failed to send confirmation email to guest:", emailError);
			// Don't fail the registration if email fails
		}

		// Send notification email to organiser (if not admin)
		const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
		if (event.organiser_uid !== ADMIN_ID) {
			try {
				const organiserEmail = await getEmailFromId(event.organiser_uid);

				if (!organiserEmail.email || organiserEmail.email === "") {
					console.log(`Warning: Organiser email not found in database for organiser ID: ${event.organiser_uid}`);
				} else {
					const organiserEmailSubject = `🔔 New Guest Registration: ${event.title}`;
					const organiserEmailText = `Hello,

A new guest has registered for your event "${event.title}".

Guest Details:
👤 Name: ${fullName}
📧 Email: ${email.toLowerCase()}
📅 Event Date: ${new Date(event.start_datetime).toLocaleDateString()}

You can manage your event registrations through your account dashboard.

Best regards,
The London Student Network Team`;

					await sendUserEmail({
						toEmail: organiserEmail.email,
						fromEmail: "hello@londonstudentnetwork.com",
						subject: organiserEmailSubject,
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