import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { getAllSocieties } from "@/app/lib/societies/queries";
import { createSociety } from "@/app/lib/societies/mutations";
import { isTargetUniversity } from "@/app/lib/societies/scoring";
import type { SocietyDraft } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/societies — every society regardless of status. */
export async function GET() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const societies = await getAllSocieties();
        return NextResponse.json({ societies });
    } catch (error) {
        console.error("Error listing societies:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}

/** POST /api/admin/societies — manually create a draft society. */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const body = (await req.json()) as Partial<SocietyDraft>;
        if (!body?.name?.trim()) {
            return NextResponse.json(
                { error: "Name is required." },
                { status: 400 },
            );
        }
        if (!isTargetUniversity(body.universityId)) {
            return NextResponse.json(
                { error: "A valid target university is required." },
                { status: 400 },
            );
        }
        const society = await createSociety({
            ...body,
            name: body.name.trim(),
            universityId: body.universityId!,
        });
        return NextResponse.json({ society }, { status: 201 });
    } catch (error) {
        console.error("Error creating society:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
