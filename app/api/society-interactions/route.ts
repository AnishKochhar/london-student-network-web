import { NextResponse } from "next/server";
import { currentUser } from "@/app/lib/societies/api-helpers";
import { getSocietyById } from "@/app/lib/societies/queries";
import { recordInteraction } from "@/app/lib/societies/mutations";
import { rateLimit, rateLimitConfigs } from "@/app/lib/rate-limit";
import type { SocietyInteractionType } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cap on the free-form metadata blob so the JSONB column can't be abused.
const MAX_METADATA_BYTES = 2000;

const VALID_TYPES: SocietyInteractionType[] = [
    "profile_view",
    "membership_click",
    "instagram_click",
    "website_click",
    "event_click",
    "save",
    "unsave",
    "share",
    "search_result_click",
];

/**
 * POST /api/society-interactions  { societyId, type, metadata? }
 *
 * Public analytics endpoint (logged or anonymous). Inbound only — it records a
 * row; it never sends anything. Only records for published+public societies, and
 * never throws to the client (analytics must not break the page).
 */
export async function POST(req: Request) {
    try {
        // Rate-limit the unauthenticated beacon by client IP (analytics only).
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "anon";
        if (!rateLimit(`society-interactions:${ip}`, rateLimitConfigs.general).success) {
            return NextResponse.json({ ok: false }, { status: 429 });
        }

        const body = (await req.json()) as {
            societyId?: string;
            type?: SocietyInteractionType;
            metadata?: Record<string, unknown>;
        };
        if (
            !body.societyId ||
            !body.type ||
            !VALID_TYPES.includes(body.type)
        ) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        const society = await getSocietyById(body.societyId);
        if (!society || society.status !== "published" || !society.isPublic) {
            // Don't record interactions for non-public profiles.
            return NextResponse.json({ ok: false }, { status: 404 });
        }

        // Drop oversized metadata rather than store an unbounded blob.
        let metadata = body.metadata;
        if (metadata && JSON.stringify(metadata).length > MAX_METADATA_BYTES) {
            metadata = undefined;
        }

        const user = await currentUser();
        await recordInteraction(body.societyId, body.type, {
            userId: user?.id ?? null,
            metadata,
        });
        return NextResponse.json({ ok: true });
    } catch {
        // Swallow — analytics failures must never surface to visitors.
        return NextResponse.json({ ok: false }, { status: 200 });
    }
}
