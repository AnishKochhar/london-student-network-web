import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { candidateToDraftSociety } from "@/app/lib/societies/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/society-imports/[id]/promote
 * Promote a reviewed candidate to a DRAFT society (never published directly).
 */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const society = await candidateToDraftSociety(id);
        return NextResponse.json({ society }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Promote failed" },
            { status: 422 },
        );
    }
}
