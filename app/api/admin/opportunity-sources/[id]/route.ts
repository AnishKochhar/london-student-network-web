import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import {
    deleteOpportunitySource,
    updateOpportunitySource,
} from "@/app/lib/opportunities/mutations";
import type { OpportunitySourceDraft } from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/opportunity-sources/[id] */
export async function PATCH(req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const data = (await req.json()) as Partial<OpportunitySourceDraft>;
        const source = await updateOpportunitySource(id, data);
        if (!source) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ source });
    } catch (error) {
        console.error("Error updating source:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

/** DELETE /api/admin/opportunity-sources/[id] */
export async function DELETE(_req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        await deleteOpportunitySource(id);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting source:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
