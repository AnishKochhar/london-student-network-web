import { NextResponse } from "next/server";
import { getPublishedOpportunities } from "@/app/lib/opportunities/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/opportunities — all published opportunities (public). */
export async function GET() {
    try {
        const opportunities = await getPublishedOpportunities();
        return NextResponse.json({ opportunities });
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return NextResponse.json(
            { error: "Failed to fetch opportunities" },
            { status: 500 },
        );
    }
}
