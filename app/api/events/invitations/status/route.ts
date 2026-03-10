import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    checkOwnershipOfEvent,
    getEventInvitationStatus,
    getEventInvitationSends,
} from "@/app/lib/data";

// GET /api/events/invitations/status?eventId=xxx
// Polled by the InvitationProgress component every 5 seconds
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }

        const hasAccess = await checkOwnershipOfEvent(session.user.id, eventId);
        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const status = await getEventInvitationStatus(eventId);
        if (!status) {
            return NextResponse.json({ error: "No invitations found" }, { status: 404 });
        }

        const progress = status.totalRecipients > 0
            ? Math.round((status.sentCount / status.totalRecipients) * 100)
            : 0;

        // Determine overall status
        const hasPending = (status.statusBreakdown.pending || 0) + (status.statusBreakdown.queued || 0) > 0;
        const overallStatus = hasPending ? "sending" : "sent";

        return NextResponse.json({
            event_id: eventId,
            status: overallStatus,
            progress,
            totalRecipients: status.totalRecipients,
            sentCount: status.sentCount,
            startedAt: status.startedAt,
            completedAt: status.completedAt,
            statusBreakdown: status.statusBreakdown,
        });
    } catch (error) {
        console.error("Error fetching invitation status:", error);
        return NextResponse.json(
            { error: "Failed to fetch status" },
            { status: 500 }
        );
    }
}

// GET /api/events/invitations/status/sends?eventId=xxx&status=sent
// Used by the expandable detail section in InvitationProgress
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId, statusFilter } = await request.json();
        if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }

        const hasAccess = await checkOwnershipOfEvent(session.user.id, eventId);
        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const sends = await getEventInvitationSends(eventId, statusFilter);

        return NextResponse.json({
            sends: sends.map((s) => ({
                id: s.id,
                recipientEmail: s.recipient_email,
                recipientName: s.recipient_name,
                status: s.status,
                sentAt: s.sent_at,
                errorMessage: s.error_message,
            })),
        });
    } catch (error) {
        console.error("Error fetching invitation sends:", error);
        return NextResponse.json(
            { error: "Failed to fetch sends" },
            { status: 500 }
        );
    }
}
