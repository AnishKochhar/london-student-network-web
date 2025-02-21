import { NextResponse } from "next/server";
import { getSecretStripePromise } from "@/app/lib/singletons-private";
import { fetchAccountId, insertAccountId } from "@/app/lib/data";

export async function POST(req: Request) {
    
    try {
        const stripe = await getSecretStripePromise();

        const { userId } = await req.json();

        // Step 1: Fetch the account
        const response = await fetchAccountId(userId);

        if (response.success) {
            if (response?.accountId) {

                const accountId = response.accountId;

                // Step 2: Create the Account Session (client secret for embedded onboarding)
                const accountSession = await stripe.accountSessions.create({
                    account: accountId,
                    components: {
                        account_onboarding: {
                            enabled: true,
                        },
                    },
                });
                // Step 3: Return the client secret         
                return NextResponse.json({ client_secret: accountSession.client_secret }, { status: 200 });
            }
        } else {
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
            return NextResponse.json({ client_secret: accountSession.client_secret }, { status: 200});
        }

        
    } catch (error) {
        console.error('Error fetching connected account:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}