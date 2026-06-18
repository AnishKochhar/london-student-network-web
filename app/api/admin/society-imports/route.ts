import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { listImportCandidates } from "@/app/lib/societies/queries";
import type { SocietyImportStatus } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/society-imports?status=needs_review */
export async function GET(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const url = new URL(req.url);
        const status = url.searchParams.get("status") as
            | SocietyImportStatus
            | null;
        const candidates = await listImportCandidates(status ?? undefined);
        return NextResponse.json({ candidates });
    } catch (error) {
        console.error("Error listing import candidates:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}
