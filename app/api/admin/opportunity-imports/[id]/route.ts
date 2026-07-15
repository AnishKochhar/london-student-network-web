import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { getImportById } from "@/app/lib/opportunities/queries";
import { enrichOpportunityImport } from "@/app/lib/opportunities/enrich";
import {
    markImportAsDuplicate,
    publishImportAsOpportunity,
    rejectOpportunityImport,
} from "@/app/lib/opportunities/mutations";
import type { OpportunityDraft } from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/opportunity-imports/[id] */
export async function GET(_req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    const record = await getImportById(id);
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ import: record });
}

/**
 * POST /api/admin/opportunity-imports/[id]
 * Body: { action: "enrich" | "publish" | "reject" | "duplicate", ... }
 *   publish   → { editedData }
 *   duplicate → { duplicateOpportunityId }
 */
export async function POST(req: Request, { params }: Params) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;

    let body: {
        action?: string;
        editedData?: OpportunityDraft;
        duplicateOpportunityId?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    try {
        switch (body.action) {
            case "enrich": {
                const record = await enrichOpportunityImport(id);
                return NextResponse.json({ import: record });
            }
            case "publish": {
                if (
                    !body.editedData?.title?.trim() ||
                    !body.editedData?.organisation?.trim()
                ) {
                    return NextResponse.json(
                        { error: "Title and organisation are required." },
                        { status: 400 },
                    );
                }
                const opportunity = await publishImportAsOpportunity(
                    id,
                    body.editedData,
                    admin.id,
                );
                if (!opportunity) {
                    return NextResponse.json(
                        { error: "Import not found" },
                        { status: 404 },
                    );
                }
                return NextResponse.json({ opportunity });
            }
            case "reject": {
                const record = await rejectOpportunityImport(id);
                return NextResponse.json({ import: record });
            }
            case "duplicate": {
                if (!body.duplicateOpportunityId) {
                    return NextResponse.json(
                        { error: "duplicateOpportunityId is required." },
                        { status: 400 },
                    );
                }
                const record = await markImportAsDuplicate(
                    id,
                    body.duplicateOpportunityId,
                );
                return NextResponse.json({ import: record });
            }
            default:
                return NextResponse.json(
                    { error: "Unknown action" },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error("Error processing import action:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
