'use server'

import { getSecretStripePromise } from "../lib/singletons-private";
import { sendUserRegistrationEmail, sendOrganiserRegistrationEmail } from "../lib/send-email";
import { fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";
import { redirect } from "next/navigation";
const stripe = await getSecretStripePromise();

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

    const loadingComponent = (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-blue-600">
                    processing your payment...
                </h2>
                <h3 className="text-2xl font-semibold text-blue-600">
                    please do not reload, or close the page
                </h3>
                <div className="mt-4 flex justify-center">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    )
    
 
    // if (session?.status === "open") {
	// 	return <p>Payment wasn&#39; t succesfull.</p>;
    // }

    // if (session?.status === 'expired') {
    //     return (
    //         <p>Session expired.</p>
    //     )
    // }

    if (session?.status === "complete") {

        // Register for event with 3 attempts
        let registrationSuccess = false;
        for (let registrationAttempt = 1; registrationAttempt <= 3; registrationAttempt++) {
            try {
                const response = await registerForEvent(userId, userEmail, userName, eventId);
                if (response.success) {
                    registrationSuccess = true;
                    break;
                }
                if (registrationAttempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`Registration attempt ${registrationAttempt} failed:`, error);
            }
        }

        if (!registrationSuccess) {
            redirect("/registration/payment-complete/server-error");
            return;
        }
    
        // Get event information
        const eventInformationResponse = await fetchRegistrationEmailEventInformation(eventId);
        if (!eventInformationResponse.success) {
            redirect("/registration/payment-complete/server-error");
            return;
        }
    
        // Send user email with 3 attempts
        let userEmailSuccess = false;
        for (let emailAttempt = 1; emailAttempt <= 3; emailAttempt++) {
            try {
                await sendUserRegistrationEmail(userEmail, eventInformationResponse.event);
                userEmailSuccess = true;
                break;
            } catch (error) {
                console.error(`User email attempt ${emailAttempt} failed:`, error);
                if (emailAttempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    
        if (!userEmailSuccess) {
            redirect("/registration/payment-complete/email-error");
            return;
        }
    
        // Get organizer email and send notification
        const organiserEmailResponse = await fetchOrganiserEmailFromEventId(eventId);
        let organiserEmailSuccess = false;
        
        for (let organiserAttempt = 1; organiserAttempt <= 3; organiserAttempt++) {
            try {
                await sendOrganiserRegistrationEmail(
                    organiserEmailResponse.email,
                    userEmail,
                    userName,
                    eventInformationResponse.event.title
                );
                organiserEmailSuccess = true;
                break;
            } catch (error) {
                console.error(`Organizer email attempt ${organiserAttempt} failed:`, error);
                if (organiserAttempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    
        if (!organiserEmailSuccess) {
            // errorLog();
        }

        redirect("/registration/payment-complete/success/thank-you");
    } else {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <h3 className="text-2xl font-semibold text-blue-600">
                        please do not reload, or close the page
                    </h3>
                    <div className="mt-4 flex justify-center">
                        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
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
