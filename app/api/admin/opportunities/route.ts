import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { getAllOpportunities } from "@/app/lib/opportunities/queries";
import { createOpportunity } from "@/app/lib/opportunities/mutations";
import type { OpportunityDraft } from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/opportunities — all opportunities (any status). */
export async function GET() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const opportunities = await getAllOpportunities();
        return NextResponse.json({ opportunities });
    } catch (error) {
        console.error("Error listing opportunities:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}

/** POST /api/admin/opportunities — create a draft (or published) opportunity. */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const draft = (await req.json()) as OpportunityDraft;
        if (!draft?.title?.trim() || !draft?.organisation?.trim()) {
            return NextResponse.json(
                { error: "Title and organisation are required." },
                { status: 400 },
            );
        }
        const opportunity = await createOpportunity(draft, admin.id);
        return NextResponse.json({ opportunity }, { status: 201 });
    } catch (error) {
        console.error("Error creating opportunity:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
