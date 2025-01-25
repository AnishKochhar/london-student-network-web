import { NextResponse } from "next/server";
import getStripe from "@/app/lib/utils/stripe";

export async function POST(req: Request) {
    try {
        const stripe = await getStripe();

        // Step 1: Create the account
        const account = await stripe.accounts.create({
            type: 'express', // or 'custom' depending on your use case
            country: 'GB', // for now force UK, but can be variable soon
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

        // Step 3: Return the client secret
        return NextResponse.json({ client_secret: accountSession.client_secret });
    } catch (error) {
        console.error('Error creating connected account:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}