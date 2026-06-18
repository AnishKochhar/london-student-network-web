import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/app/lib/opportunities/api-helpers";
import {
    getSavedOpportunities,
    getSavedOpportunityIds,
} from "@/app/lib/opportunities/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/opportunities/saved — the logged-in user's saved opportunities. */
export async function GET() {
    const user = await currentUser();
    if (!user) return unauthorized();
    try {
        const [opportunities, savedIds] = await Promise.all([
            getSavedOpportunities(user.id),
            getSavedOpportunityIds(user.id),
        ]);
        return NextResponse.json({ opportunities, savedIds });
    } catch (error) {
        console.error("Error fetching saved opportunities:", error);
        return NextResponse.json(
            { error: "Failed to fetch saved opportunities" },
            { status: 500 },
        );
    }
}
