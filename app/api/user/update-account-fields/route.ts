import { updateAccountInfo } from "@/app/lib/data";
import { NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // Rate limiting for account updates
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        // Authentication required
        const user = await requireAuth();

        const { id, data } = await req.json();

        // Validate that user can only update their own account
        if (id !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized: You can only update your own account" },
                { status: 403 }
            );
        }

        // Validate input data
        if (!data || typeof data !== 'object') {
            return NextResponse.json(
                { error: "Invalid account data provided" },
                { status: 400 }
            );
        }

        const response = await updateAccountInfo(id, data);
        return NextResponse.json(response);

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error updating account:", error);
        return NextResponse.json(
            { error: "Failed to update account" },
            { status: 500 }
        );
    }
}
