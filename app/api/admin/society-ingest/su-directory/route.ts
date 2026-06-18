import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import { getSourceById } from "@/app/lib/societies/queries";
import {
    ingestSuDirectoryHtml,
    ingestSuDirectoryFromSource,
} from "@/app/lib/societies/sources/su-directory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/society-ingest/su-directory
 * body: { universityId?, sourceId?, html? }
 *
 * - html present  → parse the pasted directory HTML (manual path, always works).
 * - sourceId only → best-effort LIVE fetch of that source's URL, then parse.
 *
 * Reads public pages only; creates reviewable candidates. Never sends anything.
 */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const body = (await req.json()) as {
            universityId?: string;
            sourceId?: string;
            html?: string;
        };

        // Manual paste path.
        if (body.html && body.html.trim()) {
            let universityId = body.universityId;
            if (!universityId && body.sourceId) {
                const source = await getSourceById(body.sourceId);
                universityId = source?.universityId ?? undefined;
            }
            if (!universityId) {
                return NextResponse.json(
                    { error: "A target university is required for pasted HTML." },
                    { status: 400 },
                );
            }
            const summary = await ingestSuDirectoryHtml({
                universityId,
                html: body.html,
                sourceId: body.sourceId ?? null,
            });
            return NextResponse.json({ summary });
        }

        // Live fetch path.
        if (body.sourceId) {
            const summary = await ingestSuDirectoryFromSource(body.sourceId);
            return NextResponse.json({ summary });
        }

        return NextResponse.json(
            { error: "Provide pasted HTML or a sourceId to fetch." },
            { status: 400 },
        );
    } catch (error) {
        // Live-fetch failures are expected (sites block bots) — surface the
        // message so the admin can paste HTML instead.
        const message =
            error instanceof Error ? error.message : "Ingestion failed.";
        return NextResponse.json({ error: message }, { status: 422 });
    }
}
