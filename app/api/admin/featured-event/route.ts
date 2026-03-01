import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    fetchFeaturedEventConfig,
    setFeaturedEvent,
    clearFeaturedEvent,
    fetchUpcomingPublicEvents,
} from "@/app/lib/data";

/**
 * GET /api/admin/featured-event
 * Fetch the current featured event configuration and list of available events
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const [featuredConfig, upcomingEvents] = await Promise.all([
            fetchFeaturedEventConfig(),
            fetchUpcomingPublicEvents(),
        ]);

        return NextResponse.json({
            success: true,
            featuredEvent: featuredConfig,
            upcomingEvents,
        });
    } catch (error) {
        console.error("Error fetching featured event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/featured-event
 * Set or update the featured event
 */
export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { event_id, custom_description, featured_start, featured_end } = body;

        if (!event_id) {
            return NextResponse.json(
                { error: "event_id is required" },
                { status: 400 }
            );
        }

        // Default featured_start to now if not provided
        const startDate = featured_start || new Date().toISOString();

        const result = await setFeaturedEvent(
            event_id,
            custom_description || null,
            startDate,
            featured_end || null,
            session.user.id as string
        );

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Featured event updated successfully",
            });
        } else {
            return NextResponse.json(
                { error: "Failed to update featured event" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error setting featured event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/featured-event
 * Clear the featured event (remove from homepage)
 */
export async function DELETE() {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await clearFeaturedEvent();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Featured event cleared successfully",
            });
        } else {
            return NextResponse.json(
                { error: "Failed to clear featured event" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error clearing featured event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
