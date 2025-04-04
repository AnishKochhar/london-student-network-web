import { NextResponse } from "next/server";
import { getSecretStripePromise } from "@/app/lib/singletons-private";
import { auth } from "@/auth";
import { fetchAccountIdByEvent, checkCapacity } from "@/app/lib/data";

const stripe = await getSecretStripePromise();


export async function POST(request: Request) {
    try {
        const userSession = await auth();

        console.log('trying to create a checkout session...');

        // directs payments to societies, after the main LSN account deducts a custom fee
        
        if (userSession?.user?.email) {
            const { priceId, eventId } = await request.json();

            // try{
            //     const response = await checkCapacity(eventId);
            //     if (!response.success) {
            //         return NextResponse.json({ message: response.error }, { status: 500 });
            //     }
            //     if (!response.spaceAvailable) {
            //         return NextResponse.json({ message: 'event capacity reached!' }, { status: 403 });
            //     }
            
            // } catch(error) {
            //     console.error('There was an error checking capacity:', error.message);
            //     return NextResponse.json({ success: false, message: 'error checking capacity' }, { status: 500 });
            // }

            const response = await fetchAccountIdByEvent(eventId); // expecting acct_1QvjSpCSTsdVXuB7
            console.log(response)

            if (!response.success) {
                return NextResponse.json({ message: "please make a stripe connect account first, by editing your account details" }, { status: 403 }); // not allowed to create paid ticket without account
            }

            const accountId = response.accountId;
            
            // Retrieve the price from the priceId, to create percentage fees
            // const price = await stripe.prices.retrieve(priceId);
            // const amount = price.unit_amount;  // Retrieve the amount to be charged
            
            // Define the fee (10p for now)
            const feeAmount = 10;  // Keep a constant 10p

            const userEmail = userSession?.user?.email;
            const userId = userSession?.user?.id;
            const userName = userSession?.user?.name;

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
                        destination: accountId, // Connected account ID
                    },
                }, // modify to not include any searchparams (let the webhook handle all data)
                ui_mode: "embedded",
                return_url: `${request.headers.get('origin')}/return/event-registration?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(userEmail)}&user_id=${encodeURIComponent(userId)}&name=${encodeURIComponent(userName)}&event_id=${encodeURIComponent(eventId)}`,
                metadata: { // this is included in the webhook data object
                    email: userEmail,
                    user_id: userId,
                    name: userName,
                    event_id: eventId,
                },
            });

            return NextResponse.json({ id: session.id, client_secret: session.client_secret });
        }

        return NextResponse.json({ message: 'Unauthorized, please log in first' }, { status: 401 });
    } catch (error) {
        console.error('An error occurred during payment session creation:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
