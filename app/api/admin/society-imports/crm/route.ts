import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { importCrmRows, type CrmRow } from "@/app/lib/societies/sources/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/society-imports/crm
 * body: { rows: Record<string, unknown>[], sourceId?: string }
 * The client parses the .xlsx/.csv into row objects and posts them here. We map
 * → dedup → create candidates → route uncertain rows to review. Nothing is sent.
 */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const body = (await req.json()) as {
            rows?: CrmRow[];
            sourceId?: string | null;
        };
        if (!Array.isArray(body?.rows) || body.rows.length === 0) {
            return NextResponse.json(
                { error: "No rows provided." },
                { status: 400 },
            );
        }
        if (body.rows.length > 5000) {
            return NextResponse.json(
                { error: "Too many rows (max 5000 per import)." },
                { status: 400 },
            );
        }
        const summary = await importCrmRows(body.rows, {
            sourceId: body.sourceId ?? null,
        });
        return NextResponse.json({ summary });
    } catch (error) {
        console.error("CRM import failed:", error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
