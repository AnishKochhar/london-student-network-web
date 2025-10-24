import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
});

// Platform fee configuration
export const PLATFORM_FEE_PERCENTAGE = parseInt(
    process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '5',
    10
);

// Helper to calculate platform fee from total amount
export function calculatePlatformFee(totalAmountInPence: number): number {
    return Math.round(totalAmountInPence * (PLATFORM_FEE_PERCENTAGE / 100));
}

// Helper to convert pounds to pence
export function poundsToPence(pounds: number | string): number {
    const amount = typeof pounds === 'string' ? parseFloat(pounds) : pounds;
    return Math.round(amount * 100);
}

// Helper to convert pence to pounds for display
export function penceToPounds(pence: number): string {
    return (pence / 100).toFixed(2);
}
