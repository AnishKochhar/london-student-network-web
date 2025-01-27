'use server'

import { Stripe } from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

let stripe: Stripe | null = null;

export default async function getSecretStripe(): Promise<Stripe> {
    if (!stripe) stripe = new Stripe(STRIPE_SECRET_KEY);
    return stripe;
}
