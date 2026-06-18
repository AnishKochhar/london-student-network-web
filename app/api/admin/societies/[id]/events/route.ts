import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { listEventCandidates } from "@/app/lib/societies/queries";
import { discoverSocietyEventCandidates } from "@/app/lib/societies/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/societies/[id]/events — event candidates for a society. */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const events = await listEventCandidates({ societyId: id });
        return NextResponse.json({ events });
    } catch (error) {
        console.error("Error listing event candidates:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

/** POST /api/admin/societies/[id]/events — discover from stored source HTML. */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const summary = await discoverSocietyEventCandidates(id);
        return NextResponse.json({ summary });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed" },
            { status: 422 },
        );
    }
}
