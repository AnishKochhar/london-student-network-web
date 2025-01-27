import { NextResponse } from "next/server";
import getStripe from "@/app/lib/utils/stripe";
import { insertAccountId } from "@/app/lib/data";

export async function POST(req: Request) {
	
	try {
		const stripe = await getStripe();

		const { userId } = await req.json();

		// Step 1: Create the account
		const account = await stripe.accounts.create({
			type: 'express', // or 'custom' depending on your use case
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true },
			},
		});

		// Step 2: Create the Account Session (client secret for embedded onboarding)
		const accountSession = await stripe.accountSessions.create({
			account: account.id,
			components: {
				account_onboarding: {
					enabled: true,
				},
			},
		});

		// Update the user record with the accountId in your database
		const response = await insertAccountId(userId, account.id);

		if (!response.success) {
			console.error('Error storing connect account id');
			return NextResponse.json({ message: "couldn't insert account id in db" }, { status: 500 });
		}

		// Step 3: Return the client secret
		return NextResponse.json({ client_secret: accountSession.client_secret }, { status: 200 });
	} catch (error) {
		console.error('Error creating connected account:', error);
		return NextResponse.json({ message: error.message }, { status: 500 });
	}
}