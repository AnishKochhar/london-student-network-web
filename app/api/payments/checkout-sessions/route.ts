import { NextResponse } from "next/server";
import { getSecretStripePromise } from "@/app/lib/singletons-private";
import { auth } from "@/auth";

const stripe = await getSecretStripePromise();

export async function POST(request: Request){
    try {
        const userSession = await auth();

        // pays directly to the LSN stripe
        
        if (userSession?.user?.email) {
            const { priceId } = await request.json();
            const session = await stripe.checkout.sessions.create({
                ui_mode: 'embedded',
                payment_method_types: ['card'],
                line_items: [
                    {
                        quantity: 1,
                        price: priceId,
                    }
                ],
                mode: 'payment',
                return_url: `${request.headers.get('origin')}/return?session_id={CHECKOUT_SESSION_ID}`
            }) 
            return NextResponse.json({id: session.id, client_secret: session.client_secret}, { status: 200 });
        }

        return NextResponse.json({message: 'Unauthorized, please log in first'}, {status: 401});

    } catch (error) {
        console.error('an error occured during payment session creation:', error);
        return NextResponse.json({message: error.message}, {status: 500});
    }
}
