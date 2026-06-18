import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { seedUniversitySources } from "@/app/lib/societies/sources/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/society-sources/seed
 * Idempotently creates the canonical source placeholders (5 SU directories +
 * LSN CRM + existing-site). Safe to run repeatedly.
 */
export async function POST() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const result = await seedUniversitySources();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error seeding society sources:", error);
        return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
    }
}
