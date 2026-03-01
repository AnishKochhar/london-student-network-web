import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

/**
 * Handle co-host invitation responses via email link or authenticated request.
 *
 * Supports both:
 * - GET with query params (from email links): ?token=xxx&action=accept|decline
 * - POST with body (from account page UI): { event_id, action } (session-authenticated)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const action = searchParams.get("action");

        if (!token || !action || !["accept", "decline"].includes(action)) {
            return NextResponse.redirect(
                new URL("/events?error=invalid-invitation", req.url)
            );
        }

        // Find the invitation by token
        const invitation = await sql`
            SELECT ec.id, ec.event_id, ec.user_id, ec.status, e.title
            FROM event_cohosts ec
            JOIN events e ON ec.event_id = e.id
            WHERE ec.invitation_token = ${token}
            LIMIT 1
        `;

        if (invitation.rows.length === 0) {
            return NextResponse.redirect(
                new URL("/events?error=invitation-not-found", req.url)
            );
        }

        const invite = invitation.rows[0];

        // Check if already responded
        if (invite.status !== "pending") {
            const shortId = base16ToBase62(invite.event_id);
            return NextResponse.redirect(
                new URL(`/events/${shortId}?notice=already-responded`, req.url)
            );
        }

        if (action === "accept") {
            await sql`
                UPDATE event_cohosts
                SET status = 'accepted', accepted_at = NOW(), invitation_token = NULL
                WHERE id = ${invite.id}
            `;
        } else {
            await sql`
                UPDATE event_cohosts
                SET status = 'declined', invitation_token = NULL
                WHERE id = ${invite.id}
            `;
        }

        // Redirect to the event page
        const shortId = base16ToBase62(invite.event_id);
        const message = action === "accept"
            ? "co-host-accepted"
            : "co-host-declined";

        return NextResponse.redirect(
            new URL(`/events/${shortId}?notice=${message}`, req.url)
        );
    } catch (error) {
        console.error("Error responding to co-host invitation:", error);
        return NextResponse.redirect(
            new URL("/events?error=invitation-error", req.url)
        );
    }
}

/**
 * POST handler for authenticated accept/decline from account page.
 */
export async function POST(req: Request) {
    try {
        const { auth } = await import("@/auth");
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { event_id, action } = await req.json();

        if (!event_id || !action || !["accept", "decline"].includes(action)) {
            return NextResponse.json({ error: "event_id and valid action required" }, { status: 400 });
        }

        // Find the invitation for this user
        const invitation = await sql`
            SELECT id, status FROM event_cohosts
            WHERE event_id = ${event_id} AND user_id = ${session.user.id}
            LIMIT 1
        `;

        if (invitation.rows.length === 0) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
        }

        if (invitation.rows[0].status !== "pending") {
            return NextResponse.json({ error: "Already responded to this invitation" }, { status: 400 });
        }

        if (action === "accept") {
            await sql`
                UPDATE event_cohosts
                SET status = 'accepted', accepted_at = NOW(), invitation_token = NULL
                WHERE id = ${invitation.rows[0].id}
            `;
        } else {
            await sql`
                UPDATE event_cohosts
                SET status = 'declined', invitation_token = NULL
                WHERE id = ${invitation.rows[0].id}
            `;
        }

        return NextResponse.json({
            success: true,
            message: action === "accept" ? "Invitation accepted" : "Invitation declined"
        });
    } catch (error) {
        console.error("Error responding to co-host invitation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
