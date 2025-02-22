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
			return NextResponse.json({message: 'you do not have permission to create the event'}, {status: 403}); // not allowed to make the event
		}

		const isNotValid = validateEvent(data);

		if (isNotValid) {
			return NextResponse.json({message: isNotValid}, {status: 400});
		}

		if (data?.tickets_price && data?.tickets_price !== '') { 
			const ticketPrice = convertToSubCurrency(data?.tickets_price);

			if (ticketPrice.error) {
				return NextResponse.json({message: 'ticket price is not valid'}, {status: 400});
			} 
	
			if (ticketPrice.value > 0) { // check if allowed to take payments + make transfers
				// const response = await fetchAccountId(data.organiser_uid);
	
				// if (!response.success || !response.accountId) {
				// 	return NextResponse.json({ message: "please make a stripe connect account first, by editing your account details" }, { status: 403 }); // not allowed to create paid ticket without account
				// }
	
				// const accountId = response.accountId;

				const accountId = 'acct_1QltReFk2QQd4u4n';
	
				// Fetch the account
				const account = await stripe.accounts.retrieve(accountId);
	
				// Check if card payments and transfers are active
				const hasCardPayments = account.capabilities?.card_payments === "active";
				const hasTransfers = account.capabilities?.transfers === "active";
	
				if (!hasCardPayments || !hasTransfers) {
					return NextResponse.json({ message: "please finish stripe connect onboarding by editing your account details" }, { status: 403 }); // not allowed to create paid ticket without full account onboarding
				}
			}
		}



		const sqlEvent = await createSQLEventObject(data);
		const response1 = await insertEvent(sqlEvent)	

		if (!response1.success) {
			return NextResponse.json({message: response1.error}, {status: 500});
		}

		if (data?.tickets_price && data?.tickets_price !== '' && data?.tickets_price !== '0') { 
			const response2 = convertToSubCurrency(data?.tickets_price);
			const subValue = response2.value;
	
			if (response2?.error) {
				return NextResponse.json({message: response2.error}, {status: 500});
			}
	
			let price_id: string;
	
			try {
				const { subcurrencyAmount, productName, description } = {
					subcurrencyAmount: subValue,
					productName: 'Standard Ticket',
					description: data?.title? `Standard Ticket for ${data.title}` : 'Standard Ticket for event',
				};
		
				if (!subcurrencyAmount || !productName) {
					return NextResponse.json({message: "the request doesn't contain important information"}, {status: 400});
				}
	
				const { priceId } = await createProduct(subcurrencyAmount, productName, description, stripe);
				price_id = priceId;
	
			} catch (error) {
				console.error("An error occurred during product creation:", error);
				return NextResponse.json({ message: error.message }, { status: 500 });
			}
	
			try {
				const response3 = await insertIntoTickets(data.tickets_price, response1.id, price_id);
				if (!response3.success) {
					return NextResponse.json({message: 'failed to insert price of ticket into database'}, {status: 500});
				}
	
			} catch (error) {
				console.error('an error occured during trying to save priceId:', error);
				return NextResponse.json({message: error.message}, {status: 500});
			}
		}
	
		return NextResponse.json({message: 'success'}, {status: 200});

	} catch(error) {
		console.error('there was an error with creating price id for new event:', error);
		return NextResponse.json({message: error.message}, {status: 500});
	}
}
