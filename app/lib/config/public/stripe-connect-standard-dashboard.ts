'use client'


import { loadConnectAndInitialize, IStripeConnectInitParams, StripeConnectInstance } from '@stripe/connect-js';

let stripeConnectPromise: Promise<{ instance: StripeConnectInstance }> | null = null;

export default async function getPromiseForStandardDashboard(userId: string) {
    if (!stripeConnectPromise) {
        const response = await fetch('/api/account/stripe-connect/standard-stripe-dashboard/details-submitted', {
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
            appearance: {
                variables: { // https://docs.stripe.com/connect/customize-connect-embedded-components
                    colorPrimary: "#3C82F6",
                    colorText: "#FFFFFF",
                    buttonPrimaryColorBackground: "#4A00FF",
                    buttonSecondaryColorBackground: "#00B5FF",
                    buttonSecondaryColorText: "#000000",
                    colorSecondaryText: "#FFFFFF",
                    actionPrimaryColorText: "#FFFFFF",
                    actionPrimaryTextDecorationColor: "#D7D9F9",
                    actionSecondaryColorText: "#EEEEEE",
                    formHighlightColorBorder: "#4A00FF",
                    formAccentColor: "#552CB5",
                    badgeNeutralColorText: "#9AAFF4",
                    borderRadius: "20px",
                    spacingUnit: "10px",
                },
            },
        };

        const instance = loadConnectAndInitialize(initParams);

        stripeConnectPromise = Promise.resolve({ instance });
    }

    return stripeConnectPromise;
}
