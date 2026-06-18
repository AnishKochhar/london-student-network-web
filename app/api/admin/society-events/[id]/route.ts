import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { updateEventCandidate } from "@/app/lib/societies/mutations";
import type { SocietyEventCandidateStatus } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KIND_TO_STATUS: Record<string, SocietyEventCandidateStatus> = {
    approve: "pending_review",
    reject: "rejected",
    duplicate: "duplicate",
};

/**
 * PATCH /api/admin/society-events/[id]
 * body.kind: "approve" | "reject" | "duplicate"
 * Note: event candidates are NOT publicly published in this phase — "approve"
 * only moves them to pending_review.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const body = (await req.json()) as { kind?: string };
        const status = body.kind ? KIND_TO_STATUS[body.kind] : undefined;
        if (!status) {
            return NextResponse.json(
                { error: "Unknown action." },
                { status: 400 },
            );
        }
        const updated = await updateEventCandidate(id, { status });
        if (!updated) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ event: updated });
    } catch (error) {
        console.error("Error updating event candidate:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
