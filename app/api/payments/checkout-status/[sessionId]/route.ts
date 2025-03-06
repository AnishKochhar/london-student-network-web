import { NextResponse } from 'next/server';
import { getSecretStripePromise } from '@/app/lib/singletons-private';

const stripe = await getSecretStripePromise();

export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await stripe.checkout.sessions.retrieve(params.sessionId, {
      expand: ['payment_intent']
    });

    return NextResponse.json({
      status: session.payment_status,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase(),
      eventId: session.metadata?.event_id,
      lastRetry: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache',
        'CDN-Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Checkout status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment status' },
      { status: 500 }
    );
  }
}
