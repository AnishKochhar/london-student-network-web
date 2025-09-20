import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkOwnershipOfEvent } from "@/app/lib/data";
import { createSQLEventData, validateModernEvent } from "@/app/lib/utils";
import { sql } from "@vercel/postgres";
import { EventFormData } from "@/app/lib/types";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...eventData }: EventFormData & { id: string } = body;

        if (!id) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // Verify ownership
        const isOwner = await checkOwnershipOfEvent(session.user.id, id);
        if (!isOwner) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Validate the updated data
        const validationError = validateModernEvent(eventData);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        // Convert to SQL format
        const sqlEventData = createSQLEventData(eventData);

        // Update the event in the database
        const result = await sql`
            UPDATE events SET
                title = ${sqlEventData.title},
                description = ${sqlEventData.description},
                start_datetime = ${sqlEventData.start_datetime},
                end_datetime = ${sqlEventData.end_datetime},
                is_multi_day = ${sqlEventData.is_multi_day},
                location_building = ${sqlEventData.location_building},
                location_area = ${sqlEventData.location_area},
                location_address = ${sqlEventData.location_address},
                image_url = ${sqlEventData.image_url},
                image_contain = ${sqlEventData.image_contain},
                event_type = ${sqlEventData.event_type},
                capacity = ${sqlEventData.capacity},
                sign_up_link = ${sqlEventData.sign_up_link},
                for_externals = ${sqlEventData.for_externals},
                external_forward_email = ${sqlEventData.external_forward_email}
            WHERE id = ${id}
            AND organiser_uid = ${session.user.id}
            AND (is_deleted IS NULL OR is_deleted = false)
        `;

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}