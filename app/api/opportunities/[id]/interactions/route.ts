import { NextResponse } from "next/server";
import { currentUser } from "@/app/lib/opportunities/api-helpers";
import { trackInteraction } from "@/app/lib/opportunities/mutations";
import type { OpportunityInteractionType } from "@/app/lib/opportunities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: OpportunityInteractionType[] = [
    "view",
    "apply_click",
    "share",
    "filter_used",
    "search_used",
    // save/unsave are recorded by the save endpoint
];

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/opportunities/[id]/interactions — record an analytics event.
 * Body: { eventType, metadata? }. Anonymous events are allowed (userId null).
 */
export async function POST(req: Request, { params }: Params) {
    const { id } = await params;
    let body: { eventType?: string; metadata?: Record<string, unknown> };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const eventType = body.eventType as OpportunityInteractionType;
    if (!eventType || !ALLOWED.includes(eventType)) {
        return NextResponse.json(
            { error: "Unsupported eventType" },
            { status: 400 },
        );
    }

    try {
        const user = await currentUser();
        await trackInteraction({
            userId: user?.id ?? null,
            opportunityId: id,
            eventType,
            metadata: body.metadata ?? null,
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error recording interaction:", error);
        // Analytics must never break the UX — return ok even on failure.
        return NextResponse.json({ ok: false });
    }
}
