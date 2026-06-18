import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { findMatchesForCandidate } from "@/app/lib/societies/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/society-imports/[id]/matches — ranked society matches. */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const matches = await findMatchesForCandidate(id);
        return NextResponse.json({
            matches: matches.map((m) => ({
                societyId: m.society.id,
                name: m.society.name,
                universityShortName: m.society.universityShortName,
                status: m.society.status,
                score: m.score,
                sameName: m.sameName,
            })),
        });
    } catch (error) {
        console.error("Error finding matches:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
