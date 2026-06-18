import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/societies/api-helpers";
import {
    getSocietyById,
    listSourcesForSociety,
} from "@/app/lib/societies/queries";
import { updateSociety } from "@/app/lib/societies/mutations";
import {
    publishSocietyProfile,
    recomputeSocietyScores,
    setSocietyPublicStatus,
    unpublishSocietyProfile,
} from "@/app/lib/societies/publish";
import { isSocietyPublishEligible } from "@/app/lib/societies/scoring";
import type { Society } from "@/app/lib/societies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fields an admin may change via the "edit" action. Deliberately EXCLUDES
// status / isPublic / publishedAt / *Score / claimStatus / slug / universityId —
// publishing is only ever reached through the gated publish action, and scores
// are computed, never hand-set.
const EDITABLE_FIELDS: (keyof Society)[] = [
    "name",
    "type",
    "category",
    "subcategory",
    "tags",
    "shortDescription",
    "description",
    "logoUrl",
    "coverImageUrl",
    "suProfileUrl",
    "membershipUrl",
    "websiteUrl",
    "instagramUrl",
    "tiktokUrl",
    "linkedinUrl",
    "linktreeUrl",
    "publicContactEmail",
    "contactEmails",
    "memberCount",
    "followerCount",
];

function sanitiseEditPatch(patch: Partial<Society>): Partial<Society> {
    const out: Partial<Society> = {};
    for (const key of EDITABLE_FIELDS) {
        if (key in patch) {
            (out as Record<string, unknown>)[key] = patch[key];
        }
    }
    return out;
}

/** GET /api/admin/societies/[id] — profile + sources + publish eligibility. */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    try {
        const society = await getSocietyById(id);
        if (!society) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const sources = await listSourcesForSociety(id);
        const eligibility = isSocietyPublishEligible(society, { sources });
        return NextResponse.json({ society, sources, eligibility });
    } catch (error) {
        console.error("Error loading society:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/societies/[id]
 * body.kind: "recompute" | "publish" | "unpublish" | "set_public" | "feature" | "edit"
 * Publishing is gated unless body.force === true (explicit admin override).
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
            force?: boolean;
            isPublic?: boolean;
            isFeatured?: boolean;
            patch?: Partial<Society>;
        };

        switch (body.kind) {
            case "recompute": {
                const r = await recomputeSocietyScores(id);
                if (!r) return notFound();
                return NextResponse.json(r);
            }
            case "publish": {
                try {
                    const r = await publishSocietyProfile(id, {
                        force: body.force,
                    });
                    return NextResponse.json(r);
                } catch (e) {
                    return NextResponse.json(
                        {
                            error:
                                e instanceof Error ? e.message : "Publish failed",
                            reasons:
                                (e as Error & { reasons?: string[] }).reasons ??
                                [],
                        },
                        { status: 422 },
                    );
                }
            }
            case "unpublish": {
                const s = await unpublishSocietyProfile(id);
                return s ? NextResponse.json({ society: s }) : notFound();
            }
            case "set_public": {
                const s = await setSocietyPublicStatus(
                    id,
                    Boolean(body.isPublic),
                );
                if (!s) {
                    return NextResponse.json(
                        {
                            error:
                                "Can't change visibility — publish the society first.",
                        },
                        { status: 422 },
                    );
                }
                return NextResponse.json({ society: s });
            }
            case "feature": {
                const s = await updateSociety(id, {
                    isFeatured: Boolean(body.isFeatured),
                });
                return s ? NextResponse.json({ society: s }) : notFound();
            }
            case "edit":
            default: {
                if (!body.patch) {
                    return NextResponse.json(
                        { error: "Nothing to edit." },
                        { status: 400 },
                    );
                }
                const safePatch = sanitiseEditPatch(body.patch);
                if (Object.keys(safePatch).length === 0) {
                    return NextResponse.json(
                        { error: "No editable fields supplied." },
                        { status: 400 },
                    );
                }
                const s = await updateSociety(id, safePatch);
                if (!s) return notFound();
                // Keep scores fresh after an edit.
                await recomputeSocietyScores(id);
                const fresh = await getSocietyById(id);
                return NextResponse.json({ society: fresh ?? s });
            }
        }
    } catch (error) {
        console.error("Error updating society:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

function notFound() {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
}
