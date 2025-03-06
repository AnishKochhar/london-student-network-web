import { insertEvent, insertIntoTickets, fetchAccountId } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils/type-manipulation';
import { FormData } from '@/app/lib/types';
import { convertToSubCurrency } from '@/app/lib/utils/type-manipulation';
import { createProduct } from '@/app/lib/utils/stripe/server-utilities';
import { getSecretStripePromise } from '@/app/lib/singletons-private';
import { validateEvent } from '@/app/lib/utils/events';
import { auth } from '@/auth';

const stripe = await getSecretStripePromise();

export async function POST(req: Request) {
	try {
		const data: FormData = await req.json();
		const session = await auth();

		if (session?.user?.id !== data.organiser_uid) {
			return NextResponse.json({ message: 'you do not have permission to create the event' }, { status: 403 }); // not allowed to make the event
		}

		const validationError = validateEvent(data); // check for errors

		if (validationError) {
			return NextResponse.json({ message: validationError }, { status: 400 });
		}

		// check for paid tickets
		const hasPaidTickets = data.tickets_info?.some(t => t?.price && t?.price > 0);
		let accountId: string | null = null;

		if (hasPaidTickets) { // check society has capabilities of selling tickets

			const response = await fetchAccountId(data.organiser_uid);

			if (!response.success) {
				console.error("DB error occurred during trying to fetch account id for stripe connect, for a society trying to make paid tickets.");
				return NextResponse.json({ message: "Internal error. Please try again later." }, { status: 500 }); // server oopsie moment
			}

			if (!response.accountId) {
				return NextResponse.json({ message: "Please make a stripe connect account first, by editing your account details." }, { status: 403 }); // not allowed to create paid ticket without account
			}

			// Fetch the account
			const account = await stripe.accounts.retrieve(response.accountId);

			// Check if payouts and transfers are active
			// const hasCardPayments = account.capabilities.card_payments === "active"; // apparently not required, as we collect payments for societies
			const hasTransfers = account.capabilities.transfers === "active";
			const hasPayouts = account.payouts_enabled === true;
			if (!hasTransfers) {
				return NextResponse.json({ message: "Your account doesn't have transfers active. Please finish your stripe connect account setup." }, { status: 403 }); // not allowed to create paid ticket without full account onboarding
			}
			if (!hasPayouts) {
				return NextResponse.json({ message: "Your account doesn't have payouts active. Please finish your stripe connect account setup." }, { status: 403 }); // not allowed to create paid ticket without full account onboarding
			}

			accountId = response.accountId;
		}

		// main event creation
		const sqlEvent = await createSQLEventObject(data);
		const response1 = await insertEvent(sqlEvent)	

		if (!response1.success) {
			return NextResponse.json({message: response1.error}, {status: 500});
		}

		if (data.tickets_info?.length) { // Really, validateEvent() should already catch all cases of no tickets specified
			// const response2 = convertToSubCurrency(data?.tickets_price);
			
			// if (response2?.error) {
			// 	return NextResponse.json({message: "Invalid ticket price."}, {status: 400});
			// }

			// const subValue = response2.value;

			// let price_id: string;

			// try {
			// 	const { subcurrencyAmount, productName, description } = {
			// 		subcurrencyAmount: subValue,
			// 		productName: 'Standard Ticket',
			// 		description: data?.title? `Standard Ticket for ${data.title}` : 'Standard Ticket for event',
			// 	};

			// 	const { priceId } = await createProduct(subcurrencyAmount, productName, description, stripe);
			// 	price_id = priceId;

			// } catch (error) {
			// 	console.error("An error occurred during product creation:", error);
			// 	return NextResponse.json({ message: error.message }, { status: 500 });
			// }

			// try {
			// 	const response3 = await insertIntoTickets(data.tickets_price, response1.id, price_id);
			// 	if (!response3.success) {
			// 		console.error("Failed to insert details into tickets table during paid event creation");
			// 		return NextResponse.json({message: 'Internal server error, please try again later.'}, {status: 500});
			// 	}

			// } catch (error) {
			// 	console.error('an error occured during trying to save priceId:', error);
			// 	return NextResponse.json({message: error.message}, {status: 500});
			// }
			const ticketsWithPrices = await Promise.all(
				data.tickets_info.map(async (ticket) => {
				  let priceId: string | null = null;
				  
				  // Handle paid tickets
				  if (ticket?.price && ticket?.price > 0) {
					const subValue = convertToSubCurrency(ticket.price);
					if (subValue.error) {
					  throw new Error(`Invalid price for ticket: ${ticket.ticketName}`);
					}
		
					try {
					  const { priceId: pid } = await createProduct(
						subValue.value,
						ticket.ticketName,
						`Ticket for ${data.title || 'event'}`,
						stripe
					  );
					  priceId = pid;
					} catch (error) {
					  console.error(`Stripe product creation failed for ${ticket.ticketName}:`, error);
					  throw new Error(`Failed to create ticket: ${ticket.ticketName}`);
					}
				  }
		
				  return {
					ticketName: ticket.ticketName,
					price: ticket.price || 0,
					priceId,
					capacity: ticket.capacity || null
				  };
				})
			);
		
			// Insert all tickets
			const ticketInsertResponse = await insertIntoTickets(
				response1.id,
				ticketsWithPrices
			);
			
			if (!ticketInsertResponse.success) {
				console.error('Ticket insertion logic failed');
				return NextResponse.json(
					{ message: 'Failed to save ticket information' }, 
					{ status: 500 }
				);
			}
		} else {
			return NextResponse.json({message: 'At least 1 event ticket must be created, even if it is free.'}, {status: 400});
		}

		return NextResponse.json({message: 'success'}, {status: 200});

	} catch(error) {
		console.error('there was an error with creating price id for new event:', error);
		return NextResponse.json({message: error.message}, {status: 500});
	}
}
