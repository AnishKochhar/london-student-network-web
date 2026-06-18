import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { enrichSociety } from "@/app/lib/societies/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/societies/[id]/enrich
 * Heuristic enrichment: fill missing profile fields + attach socials found in
 * the society's stored source HTML (Instagram confidence-gated). No network, no
 * outbound.
 */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const summary = await enrichSociety(id);
        return NextResponse.json({ summary });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Enrich failed" },
            { status: 422 },
        );
    }
}
