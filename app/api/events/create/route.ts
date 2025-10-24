import { insertModernEvent, getEventOrganiserEmail } from "@/app/lib/data";
import { NextResponse } from "next/server";
import { createSQLEventData, convertSQLEventToEvent } from "@/app/lib/utils";
import { EventFormData, SQLEvent } from "@/app/lib/types";
import { sendEventRegistrationEmail } from "@/app/lib/send-email";
import EventCreationConfirmationEmailPayload from "@/app/components/templates/event-creation-confirmation-email";
import EventCreationConfirmationEmailFallbackPayload from "@/app/components/templates/event-creation-confirmation-email-fallback";
import { sql } from "@vercel/postgres";

interface TicketType {
    id: string;
    ticket_name: string;
    ticket_price: string;
    tickets_available: number | null;
    release_name?: string | null;
    release_start_time?: string | null;
    release_end_time?: string | null;
    release_order?: number | null;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const data: EventFormData = body;
		const tickets: TicketType[] = body.tickets || [];

		// Validate required fields
		if (!data.title || !data.description || !data.organiser || !data.start_datetime || !data.end_datetime) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Validate tickets
		if (tickets.length === 0) {
			return NextResponse.json(
				{ success: false, error: "At least one ticket type is required" },
				{ status: 400 }
			);
		}

		// Check if any tickets are paid
		const hasPaidTickets = tickets.some(t => parseFloat(t.ticket_price || '0') > 0);

		// If there are paid tickets, verify organizer has Stripe account ready
		if (hasPaidTickets && data.organiser_uid) {
			const organizer = await sql`
				SELECT stripe_connect_account_id, stripe_charges_enabled, stripe_payouts_enabled
				FROM users
				WHERE id = ${data.organiser_uid}
			`;

			if (organizer.rows.length === 0) {
				return NextResponse.json(
					{ success: false, error: "Organizer not found" },
					{ status: 404 }
				);
			}

			const { stripe_connect_account_id, stripe_charges_enabled, stripe_payouts_enabled } = organizer.rows[0];

			if (!stripe_connect_account_id || !stripe_charges_enabled || !stripe_payouts_enabled) {
				return NextResponse.json(
					{ success: false, error: "You must complete Stripe Connect setup before creating events with paid tickets. Go to your Account page to set up Stripe." },
					{ status: 400 }
				);
			}
		}

		// Validate optional email field if provided
		if (data.external_forward_email && data.external_forward_email.trim() !== '') {
			const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
			if (!emailRegex.test(data.external_forward_email.trim())) {
				return NextResponse.json(
					{ success: false, error: "Invalid email format for external forward email" },
					{ status: 400 }
				);
			}
		}

		// Validate access control fields
		// Note: 'students_only' includes all account types (students, societies, companies)
		const validVisibilityLevels = ['public', 'students_only', 'verified_students', 'university_exclusive'];
		if (data.visibility_level && !validVisibilityLevels.includes(data.visibility_level)) {
			return NextResponse.json(
				{ success: false, error: "Invalid visibility level" },
				{ status: 400 }
			);
		}
		if (data.registration_level && !validVisibilityLevels.includes(data.registration_level)) {
			return NextResponse.json(
				{ success: false, error: "Invalid registration level" },
				{ status: 400 }
			);
		}

		// If university_exclusive is selected, allowed_universities must not be empty
		if ((data.visibility_level === 'university_exclusive' || data.registration_level === 'university_exclusive') &&
		    (!data.allowed_universities || data.allowed_universities.length === 0)) {
			return NextResponse.json(
				{ success: false, error: "At least one university must be selected for university-exclusive events" },
				{ status: 400 }
			);
		}

		// Validate that registration level is at least as restrictive as visibility level
		// Restrictiveness hierarchy: public (0) < logged-in users (1) < verified students (2) < university exclusive (3)
		const restrictiveness = { 'public': 0, 'students_only': 1, 'verified_students': 2, 'university_exclusive': 3 };
		const visibilityRestriction = restrictiveness[data.visibility_level as keyof typeof restrictiveness] || 0;
		const registrationRestriction = restrictiveness[data.registration_level as keyof typeof restrictiveness] || 0;
		if (registrationRestriction < visibilityRestriction) {
			return NextResponse.json(
				{ success: false, error: "Registration level must be at least as restrictive as visibility level" },
				{ status: 400 }
			);
		}

		// Convert form data to SQL format
		console.log('=== API CREATE: Calling createSQLEventData ===');
		const sqlEventData = createSQLEventData(data);
		console.log('=== API CREATE: createSQLEventData returned ===');
		console.log('SQL data to be inserted:', {
			start_datetime: sqlEventData.start_datetime,
			end_datetime: sqlEventData.end_datetime,
			title: sqlEventData.title
		});

		// Insert into database
		const response = await insertModernEvent(sqlEventData);
		console.log('=== Event created, response:', { success: response.success, hasEvent: !!response.event });

		// Insert tickets for the event
		if (response.success && response.event && tickets.length > 0) {
			console.log('=== Inserting tickets for event:', response.event.id);
			try {
				for (const ticket of tickets) {
					await sql`
						INSERT INTO tickets (
							event_uuid,
							ticket_name,
							ticket_price,
							tickets_available,
							price_id,
							release_name,
							release_start_time,
							release_end_time,
							release_order
						) VALUES (
							${response.event.id},
							${ticket.ticket_name},
							${ticket.ticket_price},
							${ticket.tickets_available},
							NULL,
							${ticket.release_name || null},
							${ticket.release_start_time || null},
							${ticket.release_end_time || null},
							${ticket.release_order || 1}
						)
					`;
				}
				console.log('✅ Tickets inserted successfully');
			} catch (ticketError) {
				console.error('❌ Failed to insert tickets:', ticketError);
				// Rollback event creation if ticket insertion fails
				await sql`DELETE FROM events WHERE id = ${response.event.id}`;
				return NextResponse.json(
					{ success: false, error: "Failed to create tickets for event" },
					{ status: 500 }
				);
			}
		}

		// Send confirmation email to organizer
		if (response.success && response.event) {
			console.log('=== Attempting to send confirmation email ===');
			try {
				console.log('Fetching organizer email for uid:', response.event.organiser_uid);
				const organizerEmail = await getEventOrganiserEmail(response.event.organiser_uid);
				console.log('Organizer email result:', organizerEmail);

				if (organizerEmail && organizerEmail.email) {
					console.log('Converting event and preparing email for:', organizerEmail.email);
					const event = convertSQLEventToEvent(response.event as SQLEvent);
					const emailSubject = `🎉 ${event.title} is now live on LSN!`;
					const emailHtml = EventCreationConfirmationEmailPayload(event);
					const emailText = EventCreationConfirmationEmailFallbackPayload(event);

					console.log('Sending confirmation email...');
					await sendEventRegistrationEmail({
						toEmail: organizerEmail.email,
						subject: emailSubject,
						html: emailHtml,
						text: emailText,
					});
					console.log('✅ Confirmation email sent successfully');
				} else {
					console.log('⚠️ No organizer email found or email is empty');
				}
			} catch (emailError) {
				console.error("❌ Failed to send event creation confirmation email:", emailError);
				// Don't fail the event creation if email fails
			}
		} else {
			console.log('⚠️ Skipping email: success =', response.success, ', hasEvent =', !!response.event);
		}

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error creating event:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
