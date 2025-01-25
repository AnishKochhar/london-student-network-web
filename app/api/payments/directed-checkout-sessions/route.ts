import { NextResponse } from "next/server";
import getStripe from "@/app/lib/utils/stripe";
import { auth } from "@/auth";

const stripe = await getStripe();

function imaginaryAccountIDFetcher() {
    return '';
    // update to actually return data;
}

export async function POST(request: Request) {
    try {
        const userSession = await auth();
        
        if (userSession?.user?.email) {
            const { priceId } = await request.json();
            
            // Retrieve the price from the priceId, assuming priceId refers to a predefined Stripe price
            const price = await stripe.prices.retrieve(priceId);
            const amount = price.unit_amount;  // Retrieve the amount to be charged
            
            // Define the fee you want to keep (1% in this case)
            const feeAmount = Math.floor(amount * 0.01);  // Keep 1% of the total price

            // Create a payment intent with destination charge (connected account)
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        quantity: 1,
                        price: priceId,
                    },
                ],
                mode: 'payment',
                payment_intent_data: {
                    application_fee_amount: feeAmount, // Your fee
                    transfer_data: {
                        destination: imaginaryAccountIDFetcher(), // Connected account ID
                    },
                },
                // The URL to redirect the user after checkout
                return_url: `${request.headers.get('origin')}/return?session_id={CHECKOUT_SESSION_ID}`,
            });

            return NextResponse.json({ id: session.id, client_secret: session.client_secret });
        }

        return NextResponse.json({ message: 'Unauthorized, please log in first' }, { status: 401 });
    } catch (error) {
        console.error('An error occurred during payment session creation:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
