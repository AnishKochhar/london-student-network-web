import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import {
    checkOwnershipOfEvent,
    fetchEventById,
    insertEventInvitations,
} from "@/app/lib/data";
import { processInvitations } from "@/app/lib/invitations/process-invitations";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import type { InvitationContentOptions } from "@/app/lib/invitations/invitation-email-template";

export const maxDuration = 300;

interface InvitationRecipient {
    email: string;
    name?: string | null;
    userId?: string | null;
    sourceEventId?: string | null;
}

interface SendInvitationsRequest {
    eventId: string;
    recipients: InvitationRecipient[];
    customMessage?: string | null;
    templateId?: string;
    contentOptions?: InvitationContentOptions;
}

// POST /api/events/invitations/send
export async function POST(request: NextRequest) {
    try {
        console.log("[INVITATIONS] Send route invoked");

        const session = await auth();
        if (!session?.user?.id) {
            console.log("[INVITATIONS] No session - returning 401");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[INVITATIONS] Authenticated as:", session.user.id);

        const body: SendInvitationsRequest = await request.json();

        console.log("[INVITATIONS] Request body - eventId:", body.eventId, "recipients:", body.recipients?.length);

        if (!body.eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }
        if (!body.recipients || body.recipients.length === 0) {
            return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
        }

        // Verify ownership
        const hasAccess = await checkOwnershipOfEvent(session.user.id, body.eventId);
        console.log("[INVITATIONS] Ownership check:", hasAccess);
        if (!hasAccess) {
            return NextResponse.json(
                { error: "You do not have permission to manage this event" },
                { status: 403 }
            );
        }

        // Fetch event details for the email template
        const event = await fetchEventById(body.eventId);
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Insert invitation rows (ON CONFLICT skips duplicates)
        const { inserted, skipped } = await insertEventInvitations(
            body.eventId,
            session.user.id,
            body.recipients,
            body.customMessage
        );

        if (inserted === 0) {
            return NextResponse.json({
                success: true,
                message: "All recipients have already been invited",
                inserted: 0,
                skipped,
                queued: false,
            });
        }

        // Build context for the email template
        const opts = body.contentOptions;
        const startDate = event.start_datetime
            ? new Date(event.start_datetime)
            : null;

        const eventDate = startDate
            ? startDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              })
            : "TBC";

        const eventTime = startDate
            ? startDate.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "TBC";

        const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
        const eventEndTime = opts?.includeDuration && endDate
            ? endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : null;

        const eventLocation = [event.location_building, event.location_area]
            .filter(Boolean)
            .join(", ") || "TBC";

        const shortId = base16ToBase62(body.eventId);
        const eventUrl = `https://londonstudentnetwork.com/events/${shortId}`;

        // Compute spots remaining if requested
        let spotsRemaining: number | null = null;
        if (opts?.includeSpotsRemaining && event.capacity) {
            const { rows } = await sql`
                SELECT COUNT(*)::int AS count
                FROM event_registrations
                WHERE event_id = ${body.eventId}::uuid
                  AND (is_cancelled = false OR is_cancelled IS NULL)
            `;
            spotsRemaining = Math.max(0, event.capacity - rows[0].count);
        }

        const context = {
            eventTitle: event.title,
            eventDate,
            eventTime,
            eventLocation,
            eventUrl,
            organiserName: event.organiser || "London Student Network",
            customMessage: body.customMessage || null,
            templateId: body.templateId || "friendly",
            eventDescription: opts?.includeDescription ? (event.description || null) : null,
            eventImageUrl: opts?.includeImage ? (event.image_url || null) : null,
            eventEndTime,
            spotsRemaining,
        };

        // Process in background (continues after response)
        waitUntil(
            processInvitations(body.eventId, context).catch((err) => {
                console.error(`[INVITATIONS] Background processing failed for ${body.eventId}:`, err);
            })
        );

        return NextResponse.json({
            success: true,
            message: `Sending invitations to ${inserted} recipients`,
            inserted,
            skipped,
            queued: true,
        });
    } catch (error) {
        console.error("Error sending invitations:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to send invitations" },
            { status: 500 }
        );
    }
}
