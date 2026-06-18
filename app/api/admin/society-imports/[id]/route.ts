import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { updateImportCandidate } from "@/app/lib/societies/mutations";
import { mergeCandidateIntoSociety } from "@/app/lib/societies/dedupe";
import type { SocietyImportStatus } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KIND_TO_STATUS: Record<string, SocietyImportStatus> = {
    reject: "rejected",
    mark_duplicate: "duplicate",
    needs_review: "needs_review",
    reset: "new",
};

/**
 * PATCH /api/admin/society-imports/[id]
 * body.kind:
 *   "reject" | "mark_duplicate" | "needs_review" | "reset" — status changes
 *   "merge_into" + { societyId } — gap-fill merge into an existing society
 * (Promote-to-draft lands in P7; full review actions in P9. No outbound here.)
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const body = (await req.json()) as {
            kind?: string;
            reviewNotes?: string;
            societyId?: string;
        };

        if (body.kind === "merge_into") {
            if (!body.societyId) {
                return NextResponse.json(
                    { error: "societyId is required to merge." },
                    { status: 400 },
                );
            }
            const result = await mergeCandidateIntoSociety(id, body.societyId);
            return NextResponse.json(result);
        }

        const status = body.kind ? KIND_TO_STATUS[body.kind] : undefined;
        if (!status) {
            return NextResponse.json(
                { error: "Unknown action." },
                { status: 400 },
            );
        }
        const updated = await updateImportCandidate(id, {
            status,
            reviewNotes: body.reviewNotes,
        });
        if (!updated) {
            return NextResponse.json(
                { error: "Candidate not found" },
                { status: 404 },
            );
        }
        return NextResponse.json({ candidate: updated });
    } catch (error) {
        console.error("Error updating import candidate:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
