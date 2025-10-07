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

        // Validate access control fields
        // Note: 'students_only' includes all account types (students, societies, companies)
        const validVisibilityLevels = ['public', 'students_only', 'verified_students', 'university_exclusive'];
        if (eventData.visibility_level && !validVisibilityLevels.includes(eventData.visibility_level)) {
            return NextResponse.json({ error: "Invalid visibility level" }, { status: 400 });
        }
        if (eventData.registration_level && !validVisibilityLevels.includes(eventData.registration_level)) {
            return NextResponse.json({ error: "Invalid registration level" }, { status: 400 });
        }

        // If university_exclusive is selected, allowed_universities must not be empty
        if ((eventData.visibility_level === 'university_exclusive' || eventData.registration_level === 'university_exclusive') &&
            (!eventData.allowed_universities || eventData.allowed_universities.length === 0)) {
            return NextResponse.json(
                { error: "At least one university must be selected for university-exclusive events" },
                { status: 400 }
            );
        }

        // Validate that registration level is at least as restrictive as visibility level
        // Restrictiveness hierarchy: public (0) < logged-in users (1) < verified students (2) < university exclusive (3)
        const restrictiveness = { 'public': 0, 'students_only': 1, 'verified_students': 2, 'university_exclusive': 3 };
        const visibilityRestriction = restrictiveness[eventData.visibility_level as keyof typeof restrictiveness] || 0;
        const registrationRestriction = restrictiveness[eventData.registration_level as keyof typeof restrictiveness] || 0;
        if (registrationRestriction < visibilityRestriction) {
            return NextResponse.json(
                { error: "Registration level must be at least as restrictive as visibility level" },
                { status: 400 }
            );
        }

        // Convert to SQL format
        console.log('=== API UPDATE: Calling createSQLEventData ===');
        const sqlEventData = createSQLEventData(eventData);
        console.log('=== API UPDATE: createSQLEventData returned ===');
        console.log('SQL data to be inserted:', {
            start_datetime: sqlEventData.start_datetime,
            end_datetime: sqlEventData.end_datetime,
            title: sqlEventData.title
        });

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
                external_forward_email = ${sqlEventData.external_forward_email},
                send_signup_notifications = ${sqlEventData.send_signup_notifications},
                visibility_level = ${sqlEventData.visibility_level},
                registration_level = ${sqlEventData.registration_level},
                allowed_universities = ${sqlEventData.allowed_universities},
                registration_cutoff_hours = ${sqlEventData.registration_cutoff_hours ?? null},
                external_registration_cutoff_hours = ${sqlEventData.external_registration_cutoff_hours ?? null}
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