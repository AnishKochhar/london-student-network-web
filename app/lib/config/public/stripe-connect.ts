'use client'


import { loadConnectAndInitialize, IStripeConnectInitParams, StripeConnectInstance } from '@stripe/connect-js';

let stripeConnectPromise: Promise<StripeConnectInstance> | null = null;

export default async function getStripeConnectPromise() {
    if (!stripeConnectPromise) {
        const initParams: IStripeConnectInitParams = {
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            fetchClientSecret: async () => {
                // Implement the logic to fetch the client secret
                const response = await fetch('/api/payments/connected-onboarding/create-connect-account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                return data.client_secret;
            },
            // Add any other initialization parameters here if needed
        };
        stripeConnectPromise = Promise.resolve(loadConnectAndInitialize(initParams));
    }
    return stripeConnectPromise;
}
