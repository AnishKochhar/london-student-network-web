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
                        notification_banner: {
                            enabled: true
                        },
                        balances: {
                            enabled: true
                        },
                        payments: {
                            enabled: true
                        },
                        payouts: {
                            enabled: true
                        },
                        account_management: {
                            enabled: true
                        },
                        documents: {
                            enabled: true
                        },
                        tax_registrations: {
                            enabled: true
                        },
                        tax_settings: {
                            enabled: true
                        },
                },
                });
                // Step 3: Return the client secret         
                return NextResponse.json({ client_secret: accountSession.client_secret }, { status: 200 });
            } else {
                return NextResponse.json({ message: "Server error - server can't decide if accountId exists or not" }, { status: 500 });
            }
        } else {
            return NextResponse.json({ message: "No stripe connect account found for user" }, { status: 403 });
        }

        
    } catch (error) {
        console.error('Error fetching connected account:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
