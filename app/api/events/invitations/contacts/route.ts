import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCoHostPastAttendees, checkOwnershipOfEvent } from "@/app/lib/data";

// POST /api/events/invitations/contacts
// Returns deduplicated past attendees across all organisers of an event
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId } = await request.json();
        if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }

        // Verify the user owns or co-hosts this event
        const hasAccess = await checkOwnershipOfEvent(session.user.id, eventId);
        if (!hasAccess) {
            return NextResponse.json({ error: "You do not have permission to manage this event" }, { status: 403 });
        }

        const { contacts, pastEvents, organisers } = await getCoHostPastAttendees(
            session.user.id,
            eventId
        );

        return NextResponse.json({
            success: true,
            contacts,
            pastEvents,
            organisers,
            totalContacts: contacts.length,
        });
    } catch (error) {
        console.error("Error fetching invitation contacts:", error);
        return NextResponse.json(
            { error: "Failed to fetch contacts" },
            { status: 500 }
        );
    }
}
