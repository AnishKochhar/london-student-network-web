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
import { checkIfRegistered, fetchSQLEventById, getUserUniversityById, registerForEvent } from "@/app/lib/data";

export async function POST(req: Request) {
	const { event_id, user_information } = await req.json();
	const user: { email: string, id: string, name: string } = user_information
	// step1: find the user
	const userUniversity = await getUserUniversityById(user.id)
	if (!userUniversity.success) {
		return NextResponse.json({success: false, error: userUniversity.error})
	}
	const event = await fetchSQLEventById(event_id)
	const eventOrganiser = event.organiser_uid
	const eventOrganiserUniversity = await getUserUniversityById(eventOrganiser)
	if (!eventOrganiserUniversity.success) {
		return NextResponse.json({success: false, error: eventOrganiserUniversity.error})
	}
	const alreadyRegistered = await checkIfRegistered(event_id, user.id)
	if (alreadyRegistered) {
		return NextResponse.json({ success: false, registered: true })
	}
	console.log("Universities", userUniversity, eventOrganiserUniversity)
	const response = await registerForEvent(user.id, user.email, user.name, event_id, userUniversity.university != eventOrganiserUniversity.university)
	return NextResponse.json(response)
}