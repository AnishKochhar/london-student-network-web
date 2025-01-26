import { NextResponse } from "next/server";
import getStripe from "@/app/lib/utils/stripe";
import { fetchAccountId } from "@/app/lib/data";

export async function POST(req: Request) {
    
    try {
        const stripe = await getStripe();

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
                return NextResponse.json({ client_secret: accountSession.client_secret });
            }
        }

        console.error('Error fetching connect account id');
        return NextResponse.json({ message: "couldn't fetch connect account id from db" }, { status: 500 });
        
    } catch (error) {
        console.error('Error fetching connected account:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}