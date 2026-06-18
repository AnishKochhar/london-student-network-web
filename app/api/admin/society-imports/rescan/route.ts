import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { rescanCandidatesForDuplicates } from "@/app/lib/societies/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/society-imports/rescan
 * Re-scores pending candidates for duplicates and routes high-risk ones to the
 * review queue. Does not merge or publish anything.
 */
export async function POST() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const summary = await rescanCandidatesForDuplicates();
        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Duplicate rescan failed:", error);
        return NextResponse.json({ error: "Rescan failed" }, { status: 500 });
    }
}
