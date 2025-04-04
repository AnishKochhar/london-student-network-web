import { getSecretStripePromise } from "@/app/lib/singletons-private";

const stripe = await getSecretStripePromise();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return new Response(JSON.stringify(session), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Session check failed' }), { status: 500 });
    }
}
