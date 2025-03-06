// 'use server'


// // ensure waiting for status to be complete (upto 40s)
// // ensure error pages are created and insightful
// // ensure searchParams are properly validated + cleaned

// import { getSecretStripePromise } from "@/app/lib/singletons-private";
// import { sendUserRegistrationEmail, sendOrganiserRegistrationEmail } from "@/app/lib/send-email";
// import { fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";
// import { redirect } from "next/navigation";
// import { getSession } from "@/app/lib/utils/stripe/server-utilities";

// const stripe = await getSecretStripePromise();


// export default async function paymentProcessingAndServiceFulfilment({ searchParams }: { searchParams: { [key: string]: string } }) {

//     const sessionId = searchParams.session_id;
//     const userEmail = searchParams.email;
//     const userId = searchParams.user_id;
//     const userName = searchParams.name;
//     const eventId = searchParams.event_id;

//     const session = await getSession(sessionId, stripe);




//     // if (session?.status === "open") {
//     // 	return <p>Payment wasn&#39; t succesfull.</p>;
//     // }

//     // if (session?.status === 'expired') {
//     //     return (
//     //         <p>Session expired.</p>
//     //     )
//     // }

//     if (session?.status === "complete") {

//         // Register for event with 3 attempts
//         let registrationSuccess = false;
//         for (let registrationAttempt = 1; registrationAttempt <= 3; registrationAttempt++) {
//             try {
//                 const response = await registerForEvent(userId, userEmail, userName, eventId);
//                 if (response.success) {
//                     registrationSuccess = true;
//                     break;
//                 }
//                 if (registrationAttempt < 3) {
//                     await new Promise(resolve => setTimeout(resolve, 1000));
//                 }
//             } catch (error) {
//                 console.error(`Registration attempt ${registrationAttempt} failed:`, error);
//             }
//         }

//         if (!registrationSuccess) {
//             redirect("/registration/payment-complete/server-error");
//             return;
//         }

//         // Get event information
//         const eventInformationResponse = await fetchRegistrationEmailEventInformation(eventId); // get everything you will need
//         if (!eventInformationResponse.success) {
//             redirect("/registration/payment-complete/server-error");
//             return;
//         }
    
//         // Send user email with 3 attempts
//         let userEmailSuccess = false;
//         for (let emailAttempt = 1; emailAttempt <= 3; emailAttempt++) {
//             try {
//                 await sendUserRegistrationEmail(userEmail, eventInformationResponse.event); // attach what email sending logic needs
//                 userEmailSuccess = true;
//                 break;
//             } catch (error) {
//                 console.error(`User email attempt ${emailAttempt} failed:`, error);
//                 if (emailAttempt < 3) {
//                     await new Promise(resolve => setTimeout(resolve, 1000));
//                 }
//             }
//         }
    
//         if (!userEmailSuccess) {
//             redirect("/registration/payment-complete/email-error");
//             return;
//         }
    
//         // Get organizer email and send notification
//         const organiserEmailResponse = await fetchOrganiserEmailFromEventId(eventId);
//         let organiserEmailSuccess = false;
        
//         for (let organiserAttempt = 1; organiserAttempt <= 3; organiserAttempt++) {
//             try {
//                 await sendOrganiserRegistrationEmail(
//                     organiserEmailResponse,
//                     userEmail,
//                     userName,
//                     eventInformationResponse.event.title
//                 );
//                 organiserEmailSuccess = true;
//                 break;
//             } catch (error) {
//                 console.error(`Organizer email attempt ${organiserAttempt} failed:`, error);
//                 if (organiserAttempt < 3) {
//                     await new Promise(resolve => setTimeout(resolve, 1000));
//                 }
//             }
//         }
    
//         if (!organiserEmailSuccess) {
//             // errorLog();
//         }

//         redirect("/registration/thank-you"); // attach everything the thank you page needs (prolly all the event info fetched above)
//     }
// }
