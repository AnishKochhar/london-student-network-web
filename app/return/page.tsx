'use server'

import getStripe from "../lib/utils/stripe";
import { sendUserRegistrationEmail, sendOrganiserRegistrationEmail } from "../lib/send-email";
import { checkIfRegistered, fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";

const stripe = await getStripe();

async function getSession(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId!);
    return session
}

export default async function CheckoutReturn({ searchParams }) {
    const sessionId = searchParams.session_id;
    const userEmail = searchParams.email;
    const userId = searchParams.user_id;
    const userName = searchParams.name;
    const eventId = searchParams.event_id;

    const session = await getSession(sessionId);
 
    if (session?.status === "open") {
		return <p>Payment wasn&#39; t succesfull.</p>;
    }

    if (session?.status === 'expired') {
        return (
            <p>Session expired.</p>
        )
    }

    if (session?.status === "complete") {
        const response = await registerForEvent(userId, userEmail, userName, eventId);

        if (response.success) {
            const eventInformationResponse = await fetchRegistrationEmailEventInformation(eventId);
            if (eventInformationResponse.success) {
                await sendUserRegistrationEmail(userEmail, eventInformationResponse.event);
            }
            const organiserEmailResponse = await fetchOrganiserEmailFromEventId(eventId)
            await sendOrganiserRegistrationEmail(organiserEmailResponse.email, userEmail, userName, eventInformationResponse.event.title);
        }


        return (
            <h3>
                We appreciate your businesss! 
                <br/>
                Your Stripe customer id is:
                <br/>
                {(session?.customer as string)}
                <br/>
                Please keep this number safe as a reference for future correspondence.
                <br/>
                Please check your email for a confirmation of payment.
            </h3>
        )
    }
}
