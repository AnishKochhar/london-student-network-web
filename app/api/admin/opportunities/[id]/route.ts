import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { getOpportunityById } from "@/app/lib/opportunities/queries";
import {
    deleteOpportunity,
    setOpportunityFeatured,
    setOpportunityStatus,
    updateOpportunity,
} from "@/app/lib/opportunities/mutations";
import type {
    OpportunityDraft,
    OpportunityStatus,
} from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/opportunities/[id] */
export async function GET(_req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    const opportunity = await getOpportunityById(id);
    if (!opportunity) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ opportunity });
}

/**
 * PATCH /api/admin/opportunities/[id]
 * Body kinds:
 *   { kind: "status", status }   — publish/close/archive/draft
 *   { kind: "feature", featured }— feature/unfeature
 *   { kind: "edit", data }       — edit fields (default if kind omitted)
 */
export async function PATCH(req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;

    let body: {
        kind?: "status" | "feature" | "edit";
        status?: OpportunityStatus;
        featured?: boolean;
        data?: OpportunityDraft;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    try {
        let opportunity = null;
        if (body.kind === "status" && body.status) {
            opportunity = await setOpportunityStatus(id, body.status);
        } else if (body.kind === "feature" && typeof body.featured === "boolean") {
            opportunity = await setOpportunityFeatured(id, body.featured);
        } else {
            const data = body.data ?? (body as unknown as OpportunityDraft);
            opportunity = await updateOpportunity(id, data);
        }
        if (!opportunity) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ opportunity });
    } catch (error) {
        console.error("Error updating opportunity:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

/** DELETE /api/admin/opportunities/[id] */
export async function DELETE(_req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        await deleteOpportunity(id);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting opportunity:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
