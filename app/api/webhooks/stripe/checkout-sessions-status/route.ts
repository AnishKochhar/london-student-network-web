import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getSecretStripePromise } from '@/app/lib/singletons-private';
import { sendUserRegistrationEmail, sendOrganiserRegistrationEmail } from "@/app/lib/send-email";
import { fetchOrganiserEmailFromEventId, registerForEvent } from "@/app/lib/data";
import { Tickets } from '@/app/lib/types';
import { markEventProcessed } from '@/app/lib/utils/stripe/server-utilities';

// ensure error pages are created and insightful
// check if we are using the correct type of session (I was expecting Stripe.Checkout.SessionResources, not Stripe.Checkout.Session)

const stripe = await getSecretStripePromise();

export async function POST(req: Request) {
	try {
		const body = await req.text(); // must be extracted as text to verify event
		const signature = headers().get('stripe-signature')!;

		console.log('IM HERE!!!!!');
		console.log('IM HERE!!!!!');
		console.log('IM HERE!!!!!');
		console.log('IM HERE!!!!!');
		console.log('IM HERE!!!!!');

		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!
		);

		console.log("I'VE MADE IT!!!!!");
		console.log("I'VE MADE IT!!!!!");
		console.log("I'VE MADE IT!!!!!");
		console.log("I'VE MADE IT!!!!!");
		console.log("I'VE MADE IT!!!!!");

		// const result = await isEventProcessed(event.id);
		// if (result) return NextResponse.json({ success: true }, { status: 200 });

		switch (event.type) {
			// case 'checkout.session.completed':
			//   await handleCheckoutCompleted(event.data.object, event);
			//   break;

			// case 'checkout.session.expired':
			//   await handleCheckoutExpired(event.data.object, event);
			//   break;

			// case 'checkout.session.async_payment_succeeded':
			//   await handleCheckoutCompleted(event.data.object, event);
			//   break;

			// case 'checkout.session.async_payment_failed':
			//   await handleCheckoutExpired(event.data.object, event);
			//   break;
			default:
				return NextResponse.json({ received: true }, { status: 200 });;
		}

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (err) {
		console.error('Webhook Error:', err);
		return NextResponse.json(
			{ success: false },
			{ status: 400 }
		);
	}
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, event: Stripe.Event) {
	try {
		// return NextResponse.json({ success: true }, { status: 200 });

		if (session.payment_status !== 'paid') {
			console.log('Payment not completed:', session.payment_status);
			return NextResponse.json({ success: false }, { status: 402 });
		}

		if (!session.metadata || typeof session.metadata !== 'object') {
			throw new Error('Invalid session metadata');
		}

		// Core Identifiers
		const user_id = session.metadata.user_id;       // User ID (from metadata)
		const eventId = session.metadata.event_id;     // Event ID (from metadata)
		const organiser_uid = session.metadata.organiser_uid;
		// User Information
		const user_email = session.metadata.email;
		const user_name = session.metadata.name;

		// Ticket Data
		const ticketDetails = JSON.parse(session.metadata.ticketDetails) as Tickets[];
		let ticket_id_to_quantity = JSON.parse(session.metadata.tickets) as Record<string, number>;
		// const ticket_id_to_quantity = new Map<string, number>(Object.entries(temp));

		const eventInfo = {
			id: eventId,
			title: session.metadata.title,
			description: session.metadata.description,
			organiser: session.metadata.organiser,
			time: session.metadata.time,
			date: session.metadata.date,
			location_building: session.metadata.building,
			location_area: session.metadata.area,
			location_address: session.metadata.address,
			image_url: '',
			image_contain: true,
			event_type: 1,
			sign_up_link: session.metadata.sign_up_link,
			for_externals: session.metadata.for_externals,
			tickets_info: []
		};


		// console.log(userId, eventId, userEmail, userName);

		const registrationResponse = await registerForEvent(
			user_id,
			user_email,
			user_name,
			eventId,
			ticket_id_to_quantity
		);

		if (!registrationResponse.success) {
			throw new Error('Registration failed: ' + JSON.stringify(registrationResponse));
		}

		// Send emails
		const userRegistrationEmailResponse = await sendUserRegistrationEmail(user_email, user_name, eventInfo, ticketDetails, ticket_id_to_quantity, organiser_uid);
		if (!userRegistrationEmailResponse.success) {
			return NextResponse.json({ success: false, error: 'Registration Email Failure\n(You have successfully registered with our system though) :)' }, { status: 501 });
		}

		const organiserEmail = await fetchOrganiserEmailFromEventId(eventId);
		if (organiserEmail) {
			const organierEmailResponse = await sendOrganiserRegistrationEmail(
				organiserEmail,
				user_email,
				user_name,
				eventInfo.title
			);
			if (!organierEmailResponse.success) {
				return NextResponse.json({ success: false, error: 'Registration Email Failure\n(You have successfully registered with our system though) :)' }, { status: 501 });
			}
		}

		await markEventProcessed(event.id);
		return NextResponse.json({ success: true }, { status: 200 });
		// redirect("/registration/payment-complete/success/thank-you");
	} catch (error) {
		console.error('Checkout processing failed:', error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 502 }
		);
	}
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session, event: Stripe.Event) {
	await markEventProcessed(event.id);
	return NextResponse.json({ success: true }, { status: 200 });
}


