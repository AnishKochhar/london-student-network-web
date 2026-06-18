import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { updateSource, deleteSource } from "@/app/lib/societies/mutations";
import {
    disableSource,
    enableSource,
    queueSourceFetch,
} from "@/app/lib/societies/sources/registry";
import type { SocietySource } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/society-sources/[id]
 * body.kind: "queue_fetch" | "disable" | "enable" | "edit"
 * Note: there is deliberately no "send"/"dispatch" action — only fetch-queueing
 * (which reads public pages later) and registry edits.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const body = (await req.json()) as {
            kind?: string;
        } & Partial<SocietySource>;

        let updated: SocietySource | null = null;
        switch (body.kind) {
            case "queue_fetch":
                updated = await queueSourceFetch(id);
                break;
            case "disable":
                updated = await disableSource(id);
                break;
            case "enable":
                updated = await enableSource(id);
                break;
            case "edit":
            default:
                updated = await updateSource(id, {
                    sourceName: body.sourceName,
                    sourceUrl: body.sourceUrl,
                    sourceType: body.sourceType,
                    trustLevel: body.trustLevel,
                });
                break;
        }

        if (!updated) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 },
            );
        }
        return NextResponse.json({ source: updated });
    } catch (error) {
        console.error("Error updating society source:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

/** DELETE /api/admin/society-sources/[id] */
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const ok = await deleteSource(id);
        return NextResponse.json({ ok });
    } catch (error) {
        console.error("Error deleting society source:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
