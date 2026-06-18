import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { bulkPublishHighConfidenceSocieties } from "@/app/lib/societies/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/societies/bulk-publish
 * Publishes every draft/pending society that passes the conservative gate.
 * No force — only genuinely eligible profiles go public.
 */
export async function POST() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const result = await bulkPublishHighConfidenceSocieties();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Bulk publish failed:", error);
        return NextResponse.json({ error: "Bulk publish failed" }, { status: 500 });
    }
}
