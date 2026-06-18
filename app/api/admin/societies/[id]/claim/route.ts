import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { getSocietyById, getClaimInviteForSociety } from "@/app/lib/societies/queries";
import {
    generateClaimInviteDraft,
    isSocietyClaimReady,
    markSocietyClaimReady,
} from "@/app/lib/societies/claim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/societies/[id]/claim — society + readiness + existing draft. */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const society = await getSocietyById(id);
        if (!society) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const readiness = await isSocietyClaimReady(id);
        const invite = await getClaimInviteForSociety(id);
        return NextResponse.json({
            society,
            readiness: { ready: readiness.ready, reasons: readiness.reasons },
            invite,
        });
    } catch (error) {
        console.error("Error loading claim preview:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

/**
 * POST /api/admin/societies/[id]/claim
 * body.kind: "generate_draft" | "mark_ready"
 * There is NO "send" action — claim invites are draft/preview only.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const body = (await req.json()) as { kind?: string };
        if (body.kind === "mark_ready") {
            const result = await markSocietyClaimReady(id);
            return NextResponse.json(result);
        }
        // default: generate a draft (the only other supported action)
        const result = await generateClaimInviteDraft(id);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed" },
            { status: 422 },
        );
    }
}
