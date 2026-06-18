import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import {
    applyReviewDecision,
    type ReviewDecision,
} from "@/app/lib/societies/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: ReviewDecision[] = [
    "approve",
    "reject",
    "merge",
    "ignore",
    "needs_more_info",
];

/**
 * PATCH /api/admin/society-review/[id]
 * body: { decision: "approve"|"reject"|"merge"|"ignore"|"needs_more_info", notes? }
 * Applies the decision to the underlying entity. No outbound side-effects.
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
            decision?: ReviewDecision;
            notes?: string;
        };
        if (!body.decision || !VALID.includes(body.decision)) {
            return NextResponse.json(
                { error: "A valid decision is required." },
                { status: 400 },
            );
        }
        const result = await applyReviewDecision(id, body.decision, {
            notes: body.notes,
        });
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed" },
            { status: 422 },
        );
    }
}
