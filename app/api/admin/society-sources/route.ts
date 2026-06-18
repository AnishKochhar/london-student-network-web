import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { listSources } from "@/app/lib/societies/queries";
import { createSource } from "@/app/lib/societies/mutations";
import type {
    SocietySourceDraft,
    SocietySourceType,
} from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: SocietySourceType[] = [
    "su_directory",
    "su_profile",
    "lsn_crm",
    "lsn_existing_site",
    "instagram",
    "linktree",
    "website",
    "event_platform",
    "manual",
    "search_result",
    "other",
];

/** GET /api/admin/society-sources */
export async function GET() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const sources = await listSources();
        return NextResponse.json({ sources });
    } catch (error) {
        console.error("Error listing society sources:", error);
        return NextResponse.json({ error: "Failed to list" }, { status: 500 });
    }
}

/** POST /api/admin/society-sources */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const body = (await req.json()) as Partial<SocietySourceDraft>;
        if (!body?.sourceName?.trim()) {
            return NextResponse.json(
                { error: "Source name is required." },
                { status: 400 },
            );
        }
        const sourceType: SocietySourceType = VALID_TYPES.includes(
            body.sourceType as SocietySourceType,
        )
            ? (body.sourceType as SocietySourceType)
            : "other";

        const source = await createSource({
            sourceType,
            sourceName: body.sourceName.trim(),
            sourceUrl: body.sourceUrl?.trim() || null,
            universityId: body.universityId || null,
            trustLevel: body.trustLevel ?? "low",
            fetchStatus: "new",
            notes: body.notes ?? null,
        });
        return NextResponse.json({ source }, { status: 201 });
    } catch (error) {
        console.error("Error creating society source:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
