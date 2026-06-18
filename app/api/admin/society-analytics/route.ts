import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { getInteractionStats, getStats } from "@/app/lib/societies/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/society-analytics — society + interaction metrics. */
export async function GET() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const [interactions, societyStats] = await Promise.all([
            getInteractionStats(),
            getStats(),
        ]);
        return NextResponse.json({ interactions, societyStats });
    } catch (error) {
        console.error("Error loading society analytics:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
