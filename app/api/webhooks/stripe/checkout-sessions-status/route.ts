import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { sql } from '@vercel/postgres';
import { getSecretStripePromise } from '@/app/lib/singletons-private';
import { sendUserRegistrationEmail, sendOrganiserRegistrationEmail } from "@/app/lib/send-email";
import { fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/utils/stripe/server-utilities";

// ensure error pages are created and insightful
// check if we are using the correct type of session (I was expecting Stripe.Checkout.SessionResources, not Stripe.Checkout.Session)

const stripe = await getSecretStripePromise();

export async function POST(req: Request) {
  try {
    const body = await req.text(); // must be extracted as text to verify event
    const signature = headers().get('stripe-signature')!;

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {

    if (!session.metadata || typeof session.metadata !== 'object') {
        throw new Error('Invalid session metadata');
    }

    // Extract with type safety
    const userId = session.metadata.userId;
    const eventId = session.metadata.eventId;
  
    if (!userId || !eventId) {
        throw new Error('Missing required metadata: userId or eventId');
    }

    // Get email from Stripe-verified source
    const userEmail = session.customer_email 
        || session.metadata.userEmail 
        || session.customer_details?.email;

    if (!userEmail) {
        throw new Error('Could not determine user email');
    }

    // Get name from customer details if available
    const userName = session.customer_details?.name 
        || session.metadata.userName 
        || '';

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
                organiserEmailResponse,
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
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
//   // Handle expired checkout
//   if (session.metadata?.cartId) {
//     await sql`
//       UPDATE carts
//       SET status = 'expired'
//       WHERE id = ${session.metadata.cartId}
//     `;

//     await resend.emails.send({
//       from: 'noreply@yourdomain.com',
//       to: session.customer_email!,
//       subject: 'Complete Your Purchase',
//       react: <CartAbandonmentEmail cartId={session.metadata.cartId} />,
//     });

//     await restoreInventory(session.metadata.items);
//   }
}

// Inventory management helpers
// async function updateInventory(items: string) {
//   const parsedItems = JSON.parse(items);
  
//   await sql`
//     UPDATE products
//     SET stock = stock - quantity
//     FROM jsonb_to_recordset(${parsedItems}::jsonb) AS i(id UUID, quantity INT)
//     WHERE products.id = i.id
//   `;
// }

// async function restoreInventory(items: string) {
//   const parsedItems = JSON.parse(items);
  
//   await sql`
//     UPDATE products
//     SET stock = stock + quantity
//     FROM jsonb_to_recordset(${parsedItems}::jsonb) AS i(id UUID, quantity INT)
//     WHERE products.id = i.id
//   `;
// }


