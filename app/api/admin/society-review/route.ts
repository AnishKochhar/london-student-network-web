import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { listReviewItems } from "@/app/lib/societies/queries";
import type { ReviewItemStatus } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/society-review?status=open */
export async function GET(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const url = new URL(req.url);
        const status = (url.searchParams.get("status") ??
            "open") as ReviewItemStatus;
        const items = await listReviewItems(status);
        return NextResponse.json({ items });
    } catch (error) {
        console.error("Error listing review items:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}
