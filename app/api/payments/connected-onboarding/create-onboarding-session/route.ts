import { NextResponse } from "next/server";
// import getStripe from "@/app/lib/utils/stripe";

export async function POST(_req: Request) {
	void _req;
	return NextResponse.json({ status: 500 });
    // try {
    //     const { accountId } = await req.json();
    //     const stripe = await getStripe();

    //     const accountSession = await stripe.accountSessions.create({
    //         account: accountId,
    //         components: {
    //             account_onboarding: {
    //                 enabled: true,
    //                 features: {
    //                     external_account_collection: true,
    //                 },
    //             },
    //         },
    //     });

    //     return NextResponse.json({ accountSession });
    // } catch (error) {
    //     console.error('Error creating account session:', error);
    //     return NextResponse.json({ message: error.message }, { status: 500 });
    // }
}