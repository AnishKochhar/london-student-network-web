import { insertEvent, insertIntoTickets } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils';
import { FormData } from '@/app/lib/types';
import { convertToSubCurrency } from '@/app/lib/utils/type-manipulation';
import stripe, { createProduct } from '@/app/lib/utils/stripe';

export async function POST(req: Request) {
	try {
		const data: FormData = await req.json();
		const sqlEvent = await createSQLEventObject(data);
		const response1 = await insertEvent(sqlEvent)	

		if (!response1.success) {
			return NextResponse.json({message: response1.error}, {status: 500});
		}

		const response2 = convertToSubCurrency(data.tickets_price);
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
			if (response3.success) {
				return NextResponse.json({message: 'success'}, {status: 200});
			} else {
				return NextResponse.json({message: 'failed to insert price of ticket into database'}, {status: 500});
			}

		} catch (error) {
			console.error('an error occured during trying to save priceId:', error);
			return NextResponse.json({message: error.message}, {status: 500});
		}

	} catch(error) {
		console.error('there was an error with creating price id for new event:', error);
		return NextResponse.json({message: error.message}, {status: 500});
	}
}
