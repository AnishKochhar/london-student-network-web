import stripe from "../lib/utils/stripe";

async function getSession(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId!);
    return session
}

export default async function CheckoutReturn({ searchParams }) {
    const sessionId = searchParams.session_id;
    const session = await getSession(sessionId);

    if (session?.status === "open") {
        return <p>Payment wasn't succesfull</p>;
    }

    if (session?.status === "complete") {
        return (
            <h3>
                We appreciate your businesss! Your Stripe customer id is:
                {(session.customer as string)}
                Please check your email for a qr code for your ticket.
            </h3>
        )
    }
}