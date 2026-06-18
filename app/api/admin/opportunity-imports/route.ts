import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { listImports } from "@/app/lib/opportunities/queries";
import { createManualOpportunityImport } from "@/app/lib/opportunities/scrape";
import type { OpportunityImportStatus } from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/admin/opportunity-imports?status=pending_review */
export async function GET(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const status = new URL(req.url).searchParams.get("status") as
            | OpportunityImportStatus
            | null;
        const imports = await listImports(status ?? undefined);
        return NextResponse.json({ imports });
    } catch (error) {
        console.error("Error listing imports:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}

/** POST /api/admin/opportunity-imports — manual URL import. Body: { url }. */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const { url } = (await req.json()) as { url?: string };
        if (!url?.trim()) {
            return NextResponse.json(
                { error: "A URL is required." },
                { status: 400 },
            );
        }
        const imported = await createManualOpportunityImport(url.trim());
        return NextResponse.json({ import: imported }, { status: 201 });
    } catch (error) {
        console.error("Error importing from URL:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to import",
            },
            { status: 400 },
        );
    }
}
