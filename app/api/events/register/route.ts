// import { NextResponse } from "next/server";
// import { checkIfRegistered, fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";
// import { sendOrganiserRegistrationEmail, sendUserRegistrationEmail } from "@/app/lib/send-email";
// import { checkIfEventIsPaid } from "@/app/lib/data/payments";

// function checkIfATicketRequiresPayment(event_id: string, ticket_id_to_quantity: Map<string, number>) {
// 	return true;
// }

// export async function POST(req: Request) {
// 	// event_id: event.id,
// 	// user_id: session.data.user.id,
// 	// ticket_id_to_quantity: ticketSelections
// 	const { event_id, user_id, ticket_id_to_quantity } = await req.json();

// 	// check if trying to register for a free ticket, but user already registered for a free ticket (one free ticket per account restriction)
// 	const alreadyRegistered = await checkIfRegistered(event_id, user_id)

// 	if (alreadyRegistered) {
// 		return NextResponse.json({ success: false, reason: 'you may only register for a free ticket once per event, per account' });
// 	}

// 	// const response = await checkCapacity(event_id);
// 	// if (!response.success) {
// 	// 	return NextResponse.json({ success: false, error: response.error })
// 	// }
// 	// if (!response.spaceAvailable) {
// 	// 	return NextResponse.json({ success: false, error: 'event capacity reached!' })
// 	// }

// 	const requiresPayment = checkIfATicketRequiresPayment(event_id);

// 	if (requiresPayment) { // Do not use this route for paid events. Instead, users should go through the payment flow and be registered with the paymentProcessingAndServiceFulfilment() server action
// 		return NextResponse.json({ requiresPayment: true, session: '' });
// 	}

// 	const registrationResponse = await registerForEvent(user_id, user.email, user.name, event_id)
// 	if (registrationResponse.success) {
// 		// Send confirmation email to user
// 		const eventInformationResponse = await fetchRegistrationEmailEventInformation(event_id);
// 		if (!eventInformationResponse.success) {
// 			return NextResponse.json({ success: false, emailError: true })
// 		}
// 		await sendUserRegistrationEmail(user.email, eventInformationResponse.event)
// 		// Send confirmation email to organiser
// 		const organiserEmailResponse = await fetchOrganiserEmailFromEventId(event_id)
// 		if (!organiserEmailResponse) {
// 			return NextResponse.json({ success: false, emailError: true })
// 		}
// 		await sendOrganiserRegistrationEmail(organiserEmailResponse, user.email, user.name, eventInformationResponse.event.title)
// 	}

// 	return NextResponse.json(registrationResponse)
// }

import { NextResponse } from "next/server";
import { getSecretStripePromise } from "@/app/lib/singletons-private";
import { registerForEvent, fetchOrganiserEmailFromEventId, fetchEventById, getUserById, fetchTicketDetails, checkForFreeTickets, fetchAccountIdByEvent } from "@/app/lib/data";
import { sendOrganiserRegistrationEmail, sendUserRegistrationEmail } from "@/app/lib/send-email";
import { Event } from "@/app/lib/types";

const stripe = await getSecretStripePromise();

// Dummy functions (implement these according to your data source)
// async function fetchUserInformation(userId: string) {
//   // Return user object with email, name, etc.
// }



// async function getEventInformation(eventId: string): Promise<Event> {
//   // Return complete event information
// }

export async function POST(req: Request) {
	const { event_id, user_id, ticket_id_to_quantity }: { event_id: string, user_id: string, ticket_id_to_quantity: Record<string, number> } = await req.json();

	try {
		// Fetch required data
		const user = await getUserById(user_id);
		let event: Event;
		let organiser_uid: string;
		try {
			const result = await fetchEventById(event_id);
			if (!result.success) return NextResponse.json({ success: false, error: 'failed to retrieve an event by an id' }, { status: 500 });
			event = result.event;
			organiser_uid = result.organiser_uid;

		} catch (error) {
			return NextResponse.json({ success: false, error }, { status: 500 });
		}
		const result = await fetchTicketDetails(Object.keys(ticket_id_to_quantity));
		if (!result.success) {
			return NextResponse.json({
				success: false,
				error: result.error
			}, { status: 500 });
		}
		const ticketDetails = result.tickets;

		for (const [ticketId, requestedQty] of Object.entries(ticket_id_to_quantity)) { // capacity check
			const ticket = ticketDetails.find(t => t.ticket_uuid === ticketId);

			if (!ticket) {
				return NextResponse.json({
					success: false,
					error: `Invalid ticket ID: ${ticketId}`
				}, { status: 400 });
			}

			if (requestedQty < 0) {
				return NextResponse.json({
					success: false,
					error: `quantity must be a non-negative whole number`
				}, { status: 400 });
			}

			// Check capacity if ticket has limited availability
			if (ticket.tickets_available !== null) {
				if (ticket.tickets_available < requestedQty) {
					return NextResponse.json({
						success: false,
						error: `not enough tickets available at this time for the request`
					}, { status: 400 });
				}
			}
		}

		const alreadyHasAFreeTicket = await checkForFreeTickets(user_id, event_id);

		const numberOfRequestedFreeTickets = ticketDetails.filter(t => t.ticket_price <= 0 || t.ticket_price === null).length;
		// console.log(alreadyHasAFreeTicket || "doesn't have a free ticket", tryingToGetAFreeTicket || "not trying to get a free ticket", ticketDetails || "failed to fetch ticket details", ticket_id_to_quantity);

		if (numberOfRequestedFreeTickets > 1) {
			return NextResponse.json({
				success: false,
				error: 'Cannot register for multiple free tickets'
			}, { status: 400 });
		}
		if (alreadyHasAFreeTicket.hasFreeTicket && numberOfRequestedFreeTickets > 0) {
			return NextResponse.json({
				success: false,
				error: 'Cannot register for free tickets for the same event again'
			}, { status: 400 });
		}

		// Separate paid and free tickets
		const paidTickets = ticketDetails.filter(t => t.ticket_price > 0);
		const freeTickets = ticketDetails.filter(t => t.ticket_price <= 0 || t.ticket_price === null);

		// Handle case for only free tickets
		if (freeTickets.length === 1 && paidTickets.length === 0) {
			
			// DEBUG: Print the tickets ID and Quantity in readable form
			console.log(
				Object.entries(ticket_id_to_quantity)
					.map(([ticketId, quantity]) => `${ticketId}: ${quantity}`)
					.join(', ')
			);

			const registrationResponse = await registerForEvent(
				user_id,
				user.email,
				user.name,
				event_id,
				ticket_id_to_quantity
			);

			if (!registrationResponse.success) {
				return NextResponse.json({ error: 'Server error - failed to register for requested free ticket' }, { status: 500 });
			}

			// Send emails
			const userRegistrationEmailResponse = await sendUserRegistrationEmail(user.email, user.name, event, ticketDetails, ticket_id_to_quantity, organiser_uid);
			if (!userRegistrationEmailResponse.success) {
				return NextResponse.json({ success: false, error: 'Registration Email Failure\n(You have successfully registered with our system though) :)' }, { status: 501 });
			}

			// TODO: Uncomment/Delete this for organiser confirmation emails!
			// const organiserEmail = await fetchOrganiserEmailFromEventId(event_id);
			// if (organiserEmail) {
			// 	const organierEmailResponse = await sendOrganiserRegistrationEmail(
			// 		organiserEmail,
			// 		user.email,
			// 		user.name,
			// 		event.title
			// 	);
			// 	if (!organierEmailResponse.success) {
			// 		return NextResponse.json({ success: false, error: 'Registration Email Failure\n(You have successfully registered with our system though) :)' }, { status: 501 });
			// 	}
			// }

			return NextResponse.json({ success: true, requiresPayment: false }, { status: 200 });
		}

		// Handle paid tickets
		if (paidTickets.length > 0) {
			const accountResponse = await fetchAccountIdByEvent(event_id);
			if (!accountResponse.success) {
				return NextResponse.json({
					error: "Organizer needs Stripe Connect account",
					success: false
				}, { status: 403 });
			}

			const lineItems = paidTickets.map(ticket => ({
				price: ticket.price_id,
				quantity: ticket_id_to_quantity[ticket.ticket_uuid]
			}));

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: lineItems,
				mode: 'payment',
				payment_intent_data: {
					application_fee_amount: 10 * lineItems.length, // 10p per item
					transfer_data: { destination: accountResponse.accountId }
				},
				ui_mode: "embedded",
				return_url: `${req.headers.get('origin')}/return/event-registration?session_id={CHECKOUT_SESSION_ID}`,
				metadata: {
					email: user.email,
					user_id: user_id,
					name: user.name,
					event_id: event_id,
					ticketDetails: JSON.stringify(ticketDetails),
					tickets: JSON.stringify(ticket_id_to_quantity),
					organiser_uid,
					title: event.title,
					description: event.description,
					sign_up_link: event.sign_up_link,
					for_externals: event.for_externals,
					organiser: event.organiser,
					date: event.date,
					time: event.time,
					building: event.location_building,
					area: event.location_area,
					address: event.location_address
				}
			});

			return NextResponse.json({
				success: true,
				requiresPayment: true,
				client_secret: session.client_secret
			}, { status: 200 });
		}

		return NextResponse.json({
			success: false,
			error: 'Invalid ticket selection'
		}, { status: 400 });

	} catch (error) {
		console.error('Registration error:', error);
		return NextResponse.json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
}