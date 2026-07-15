import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/app/lib/opportunities/api-helpers";
import {
    saveOpportunity,
    unsaveOpportunity,
} from "@/app/lib/opportunities/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/opportunities/[id]/save — save for the logged-in user. */
export async function POST(_req: Request, { params }: Params) {
    const user = await currentUser();
    if (!user) return unauthorized("Sign in to save opportunities.");
    const { id } = await params;
    try {
        const result = await saveOpportunity(user.id, id);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error saving opportunity:", error);
        return NextResponse.json(
            { error: "Failed to save opportunity" },
            { status: 500 },
        );
    }
}

/** DELETE /api/opportunities/[id]/save — unsave for the logged-in user. */
export async function DELETE(_req: Request, { params }: Params) {
    const user = await currentUser();
    if (!user) return unauthorized("Sign in to manage saved opportunities.");
    const { id } = await params;
    try {
        const result = await unsaveOpportunity(user.id, id);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error unsaving opportunity:", error);
        return NextResponse.json(
            { error: "Failed to unsave opportunity" },
            { status: 500 },
        );
    }
}
