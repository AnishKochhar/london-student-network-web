import { NextResponse } from "next/server";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request: Request){
    try {
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

        return NextResponse.json({id: session.id, client_secret: session.client_secret});
    } catch (error) {
        console.error('an error occured during payment session creation:', error);
        return NextResponse.json({message: error.message}, {status: 500});
    }
}