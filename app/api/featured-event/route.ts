import { NextResponse } from "next/server";
import { fetchActiveFeaturedEvent } from "@/app/lib/data";

/**
 * GET /api/featured-event
 * Public endpoint to fetch the currently active featured event for the homepage
 */
export async function GET() {
    try {
        const result = await fetchActiveFeaturedEvent();

        if (!result) {
            return NextResponse.json({
                success: true,
                featuredEvent: null,
            });
        }

        return NextResponse.json({
            success: true,
            featuredEvent: {
                event: result.event,
                customDescription: result.customDescription,
            },
        });
    } catch (error) {
        console.error("Error fetching featured event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
