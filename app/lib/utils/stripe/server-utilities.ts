'use server'

import { Stripe } from "stripe";
import { getRedisClientInstance } from "../../singletons-private";

const redis = await getRedisClientInstance();

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

export async function getSession(sessionId: string, stripe: Stripe) {
    const session = await stripe.checkout.sessions.retrieve(sessionId!);
    return session
}

// Check if event was processed (prevents duplicate handling)
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const key = `stripe_event:${eventId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

// Mark event as processed (3 day expiration matches Stripe's retry window)
export async function markEventProcessed(eventId: string): Promise<void> {
  const key = `stripe_event:${eventId}`;
  await redis.set(key, 'processed', 'EX', 259200); // 3 days in seconds
}

