'use server';

import { getSecretStripePromise } from "@/app/lib/singletons-private";
import { sendUserRegistrationEmail, sendOrganiserRegistrationEmail } from "@/app/lib/send-email";
import { fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/utils/stripe/server-utilities";
import { Tickets } from '@/app/lib/types';
import Stripe from "stripe";

const stripe = await getSecretStripePromise();
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

async function retryOperation<T>(
    operation: () => Promise<T>,
    errorLabel: string
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`${errorLabel} attempt ${attempt} failed:`, error);
        if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    throw new Error(`${errorLabel} failed after ${MAX_RETRIES} attempts`);
}

export default async function paymentProcessingAndServiceFulfilment({ searchParams }: { searchParams: { [key: string]: string } }) {
    // Validate only session_id comes from client-side
    const sessionId = searchParams['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
        redirect("/registration/invalid-session");
    }

    try {

        let session: Stripe.Checkout.Session;
        let paymentCheckAttempt = 1;
        while (paymentCheckAttempt <= MAX_RETRIES) {
            session = await getSession(sessionId, stripe);
            if (session?.payment_status === 'paid') break;
            
            if (paymentCheckAttempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
            paymentCheckAttempt++;
        }

        if (session.payment_status !== 'paid') {
            redirect("/registration/payment-incomplete");
        }
        // Retrieve and validate Stripe session
        // const session = await getSession(sessionId, stripe);
        
        if (!session) {
            redirect("/registration/invalid-session");
        }

        // Validate metadata structure
        if (!session.metadata || typeof session.metadata !== 'object') {
            redirect("/registration/invalid-metadata");
        }

        

        // Extract all values from session metadata
        const requiredMetadata = [
            'user_id', 'event_id', 'email', 'name',
            'ticketDetails', 'tickets', 'organiser_uid'
        ];
        
        for (const param of requiredMetadata) {
            if (!session.metadata[param]) {
                redirect("/registration/incomplete-metadata");
            }
        }

        // Type-safe extraction
        // const { 
        //     user_id: userId,
        //     event_id: eventId,
        //     email: userEmail,
        //     name: userName,
        //     ticketDetails,
        //     tickets,
        //     organiser_uid: organiserUid
        // } = session.metadata;
      // Core Identifiers

      const user_id = session.metadata.user_id;       // User ID (from metadata)
      const eventId = session.metadata.event_id;     // Event ID (from metadata)
      const organiser_uid = session.metadata.organiser_uid;
      // User Information
      const user_email = session.metadata.email;
      const user_name = session.metadata.name;

      // Ticket Data
      const ticketDetails = JSON.parse(session.metadata.ticketDetails) as Tickets[];
      console.log(ticketDetails);
      let ticket_id_to_quantity = JSON.parse(session.metadata.tickets) as Record<string, number>;
      // console.log(temp);
      // const ticket_id_to_quantity = new Map<string, number>(Object.entries(temp));
      console.log(ticket_id_to_quantity);
      console.log('.');
      console.log('.');
      console.log('.');
      console.log('.');
      console.log('.');
      console.log('.');

      const eventInfo = {
        id: eventId,
        title: session.metadata.title,
        description: session.metadata.description,
        organiser: session.metadata.organiser,
        time: session.metadata.time,
        date: session.metadata.date,
        location_building: session.metadata.building,
        location_area: session.metadata.area,
        location_address: session.metadata.address,
        image_url: '',
        image_contain: true,
        event_type: 1,
        sign_up_link: session.metadata.sign_up_link,
        for_externals: session.metadata.for_externals,
        tickets_info: []
      };
        // Validate payment status


        // ... rest of the implementation using metadata values ...
        // [Keep the existing retry logic but use metadata values instead of searchParams]

        // const registrationResponse = await registerForEvent(
        //     user_id, 
        //     user_email, 
        //     user_name, 
        //     eventId,
        //     ticket_id_to_quantity
        //   );

          const registrationResponse = await retryOperation(
            () => registerForEvent(
                user_id, 
                user_email, 
                user_name, 
                eventId,
                ticket_id_to_quantity
            ),
            'Event registration'
        );
    
          if (!registrationResponse.success) {
            throw new Error('Registration failed: ' + JSON.stringify(registrationResponse));
          }
    
          // Send emails
          await retryOperation(
            () => sendUserRegistrationEmail(user_email, user_name, eventInfo, ticketDetails, ticket_id_to_quantity, organiser_uid),
            'User email sending'
        );
        //   await sendUserRegistrationEmail(user_email, user_name, eventInfo, ticketDetails, ticket_id_to_quantity, organiser_uid);
          const organiserEmail = await fetchOrganiserEmailFromEventId(eventId);
          if (organiserEmail) {
            await sendOrganiserRegistrationEmail(
              organiserEmail, 
              user_email, 
              user_name, 
              eventInfo.title
            );
          }

        // return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Payment processing failed:', error);
        throw new Error('error with server action:', error)
        // redirect("/registration/payment-complete/server-error");
    }
}
