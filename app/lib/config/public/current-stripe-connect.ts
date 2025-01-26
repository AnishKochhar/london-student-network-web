'use client'


import { loadConnectAndInitialize, IStripeConnectInitParams, StripeConnectInstance } from '@stripe/connect-js';

let stripeConnectPromise: Promise<{ instance: StripeConnectInstance }> | null = null;

export default async function getCurrentStripeConnectPromise(userId: string) {
    if (!stripeConnectPromise) {
        const response = await fetch('/api/payments/connected-onboarding/resume-connected-onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch account creation data');
        }

        const data = await response.json();
        const { client_secret } = data;

        if (!client_secret) {
            throw new Error('failed to retrieve client secret');
        }

        const initParams: IStripeConnectInitParams = {
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            fetchClientSecret: async () => client_secret, // Use fetched client_secret
        };

        const instance = loadConnectAndInitialize(initParams);

        stripeConnectPromise = Promise.resolve({ instance });
    }

    return stripeConnectPromise;
}
