'use server'

import { Stripe } from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

let stripe: Stripe | null = null;

export default async function getStripe(): Promise<Stripe> {
    if (!stripe) stripe = new Stripe(STRIPE_SECRET_KEY);
    return stripe;
}


export async function createProduct(subcurrencyAmount: number, productName: string, description: string, stripe: Stripe) {
    try {
        // Step 1: Create a new product
        const product = await stripe.products.create({
            name: productName,
            description: description || "",
        });

        // console.log("Product created:", product.id);

        // Step 2: Create a price for the product
        const price = await stripe.prices.create({
            unit_amount: subcurrencyAmount, // Price in smallest currency unit (e.g., cents)
            currency: "gbp",
            product: product.id,
        });

        // console.log("Price created:", price.id);

        return { productId: product.id, priceId: price.id };
    } catch (error) {
        console.error("Error creating product or price:", error);
        throw error;
    }
}