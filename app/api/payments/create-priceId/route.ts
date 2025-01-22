// import Stripe from "stripe";
// import { NextResponse } from "next/server";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// async function createTestProduct(subcurrencyAmount: number, productName: string) {
//     try {
//         // Step 1: Create a new product
//         const product = await stripe.products.create({
//             name: productName,
//             description: "This is a test product created programmatically.",
//         });

//         console.log("Product created:", product.id);

//         // Step 2: Create a price for the product
//         const price = await stripe.prices.create({
//             unit_amount: subcurrencyAmount, // Price in smallest currency unit (e.g., cents)
//             currency: "gbp",
//             product: product.id,
//         });

//         console.log("Price created:", price.id);

//         return { productId: product.id, priceId: price.id };
//     } catch (error) {
//         console.error("Error creating product or price:", error);
//         throw error;
//     }
// }

// export async function POST(request: Request) {
//     try {
//         const { subcurrencyAmount, productName } = await request.json();

//         if (!subcurrencyAmount || !productName) {
//             throw new Error("subcurrencyAmount and productName are required fields.");
//         }

//         const { productId, priceId } = await createTestProduct(subcurrencyAmount, productName);

//         return NextResponse.json({ productId, priceId });
//     } catch (error) {
//         console.error("An error occurred during product creation:", error);
//         return NextResponse.json({ message: error.message }, { status: 500 });
//     }
// }
