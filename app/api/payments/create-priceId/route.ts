import { NextResponse } from "next/server";
import stripe, { createProduct } from "@/app/lib/utils/stripe";


export async function POST(request: Request) {
    try {
        const { subcurrencyAmount, productName, description } = await request.json();

        if (!subcurrencyAmount || !productName) {
            throw new Error("subcurrencyAmount and productName are required fields.");
        }

        const { productId, priceId } = await createProduct(subcurrencyAmount, productName, description, stripe);

        return NextResponse.json({ productId, priceId });
    } catch (error) {
        console.error("An error occurred during product creation:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
