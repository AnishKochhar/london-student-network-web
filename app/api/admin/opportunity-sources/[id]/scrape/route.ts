import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { runOpportunitySourceScrape } from "@/app/lib/opportunities/scrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/opportunity-sources/[id]/scrape — run a scrape now. */
export async function POST(_req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const run = await runOpportunitySourceScrape(id);
        return NextResponse.json({ run });
    } catch (error) {
        console.error("Error running scrape:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to scrape",
            },
            { status: 500 },
        );
    }
}
