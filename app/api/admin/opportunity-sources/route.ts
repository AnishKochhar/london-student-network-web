import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { listSources } from "@/app/lib/opportunities/queries";
import { createOpportunitySource } from "@/app/lib/opportunities/mutations";
import type { OpportunitySourceDraft } from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/opportunity-sources */
export async function GET() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const sources = await listSources();
        return NextResponse.json({ sources });
    } catch (error) {
        console.error("Error listing sources:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}

/** POST /api/admin/opportunity-sources */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const data = (await req.json()) as OpportunitySourceDraft;
        if (!data?.name?.trim() || !data?.url?.trim()) {
            return NextResponse.json(
                { error: "Name and URL are required." },
                { status: 400 },
            );
        }
        const source = await createOpportunitySource(data);
        return NextResponse.json({ source }, { status: 201 });
    } catch (error) {
        console.error("Error creating source:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
