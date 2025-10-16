import { sql } from "@vercel/postgres";
import {
    SQLEvent,
    ContactFormInput,
    SocietyRegisterFormData,
    UserRegisterFormData,
    SQLRegistrations,
    OrganiserAccountEditFormData,
    CompanyRegisterFormData,
    CompanyInformation,
} from "./types";
import {
    convertSQLEventToEvent,
    formatDOB,
    selectUniversity,
    capitalize,
    convertSQLRegistrationsToRegistrations,
    capitalizeFirst,
    FallbackStatistics,
    properTitleCase,
} from "./utils";
import bcrypt from "bcrypt";
import { Tag } from "./types";

// needs organisation

export async function fetchWebsiteStats() {
    // return FallbackStatistics
    try {
        const stats = await sql`
        SELECT
            (SELECT COUNT(*) FROM events) AS total_events,
            (SELECT COUNT(DISTINCT university_attended) FROM user_information) AS total_universities,
            (SELECT COUNT(*) FROM users WHERE role = 'organiser') AS total_societies
    	`;
        // console.log("fetched stats:", stats.rows)
        return stats.rows[0];
    } catch (error) {
        console.error("Database error:", error);
        // TODO: here is the error, so it will always return the fallback stat
        return FallbackStatistics;
    }
}

export async function checkOwnershipOfEvent(userId: string, eventId: string) {
    try {
        const data = await sql<SQLEvent>`
		SELECT organiser_uid
		FROM events
		WHERE id = ${eventId}
		`;

        return data?.rows[0]?.organiser_uid === userId;
    } catch (error) {
        console.error("database function error:", error);
        throw new Error("Failed to verify ownership in database function");
    }
}

export async function fetchEvents() {
    try {
        const data = await sql<SQLEvent>`SELECT * FROM events`;
        return data.rows.map(convertSQLEventToEvent);
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch events data");
    }
}

export async function fetchAllUpcomingEvents(
    userSession?: { id?: string; verified_university?: string; role?: string } | null
) {
    try {
        let data;

        // Bypass visibility restrictions for organiser and company accounts
        if (userSession?.role === 'organiser' || userSession?.role === 'company') {
            // Show ALL events regardless of visibility level
            data = await sql<SQLEvent>`
                SELECT e.*, s.slug as organiser_slug
                FROM events e
                LEFT JOIN society_information s ON e.organiser_uid = s.user_id
                WHERE COALESCE(e.end_datetime, make_timestamp(e.year, e.month, e.day, 23, 59, 59)) >= NOW()
                AND (e.is_deleted IS NULL OR e.is_deleted = false)
                AND (e.is_hidden IS NULL OR e.is_hidden = false)
                ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day,
                    EXTRACT(hour FROM e.start_time::time)::int,
                    EXTRACT(minute FROM e.start_time::time)::int, 0))
            `;
        } else if (!userSession) {
            // Not logged in - only show public events
            data = await sql<SQLEvent>`
                SELECT e.*, s.slug as organiser_slug
                FROM events e
                LEFT JOIN society_information s ON e.organiser_uid = s.user_id
                WHERE COALESCE(e.end_datetime, make_timestamp(e.year, e.month, e.day, 23, 59, 59)) >= NOW()
                AND (e.is_deleted IS NULL OR e.is_deleted = false)
                AND (e.is_hidden IS NULL OR e.is_hidden = false)
                AND (e.visibility_level = 'public' OR e.visibility_level IS NULL)
                ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day,
                    EXTRACT(hour FROM e.start_time::time)::int,
                    EXTRACT(minute FROM e.start_time::time)::int, 0))
            `;
        } else if (userSession.verified_university) {
            // Logged in with verified university - can see all except restricted university events they're not part of
            data = await sql<SQLEvent>`
                SELECT e.*, s.slug as organiser_slug
                FROM events e
                LEFT JOIN society_information s ON e.organiser_uid = s.user_id
                WHERE COALESCE(e.end_datetime, make_timestamp(e.year, e.month, e.day, 23, 59, 59)) >= NOW()
                AND (e.is_deleted IS NULL OR e.is_deleted = false)
                AND (e.is_hidden IS NULL OR e.is_hidden = false)
                AND (
                    e.visibility_level = 'public'
                    OR e.visibility_level = 'students_only'
                    OR e.visibility_level = 'verified_students'
                    OR e.visibility_level IS NULL
                    OR (
                        e.visibility_level = 'university_exclusive'
                        AND ${userSession.verified_university} = ANY(e.allowed_universities)
                    )
                )
                ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day,
                    EXTRACT(hour FROM e.start_time::time)::int,
                    EXTRACT(minute FROM e.start_time::time)::int, 0))
            `;
        } else {
            // Logged in but no verified university - can see public and students_only
            data = await sql<SQLEvent>`
                SELECT e.*, s.slug as organiser_slug
                FROM events e
                LEFT JOIN society_information s ON e.organiser_uid = s.user_id
                WHERE COALESCE(e.end_datetime, make_timestamp(e.year, e.month, e.day, 23, 59, 59)) >= NOW()
                AND (e.is_deleted IS NULL OR e.is_deleted = false)
                AND (e.is_hidden IS NULL OR e.is_hidden = false)
                AND (
                    e.visibility_level = 'public'
                    OR e.visibility_level = 'students_only'
                    OR e.visibility_level IS NULL
                )
                ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day,
                    EXTRACT(hour FROM e.start_time::time)::int,
                    EXTRACT(minute FROM e.start_time::time)::int, 0))
            `;
        }

        return data.rows.map(convertSQLEventToEvent);
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch upcoming events");
    }
}

export async function fetchUpcomingEvents(
    userSession?: { id?: string; verified_university?: string; role?: string } | null
) {
    try {
        let data;

        // Bypass visibility restrictions for organiser and company accounts
        if (userSession?.role === 'organiser' || userSession?.role === 'company') {
            // Show ALL events regardless of visibility level
            data = await sql<SQLEvent>`
                SELECT * FROM events
                WHERE COALESCE(end_datetime, make_timestamp(year, month, day, 23, 59, 59)) >= NOW()
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
                ORDER BY COALESCE(start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0))
                LIMIT 6
            `;
        } else if (!userSession) {
            // Not logged in - only show public events
            data = await sql<SQLEvent>`
                SELECT * FROM events
                WHERE COALESCE(end_datetime, make_timestamp(year, month, day, 23, 59, 59)) >= NOW()
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
                AND (visibility_level = 'public' OR visibility_level IS NULL)
                ORDER BY COALESCE(start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0))
                LIMIT 6
            `;
        } else if (userSession.verified_university) {
            // Logged in with verified university - can see all except restricted university events they're not part of
            data = await sql<SQLEvent>`
                SELECT * FROM events
                WHERE COALESCE(end_datetime, make_timestamp(year, month, day, 23, 59, 59)) >= NOW()
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
                AND (
                    visibility_level = 'public'
                    OR visibility_level = 'students_only'
                    OR visibility_level = 'verified_students'
                    OR visibility_level IS NULL
                    OR (
                        visibility_level = 'university_exclusive'
                        AND ${userSession.verified_university} = ANY(allowed_universities)
                    )
                )
                ORDER BY COALESCE(start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0))
                LIMIT 6
            `;
        } else {
            // Logged in but no verified university - can see public and students_only
            data = await sql<SQLEvent>`
                SELECT * FROM events
                WHERE COALESCE(end_datetime, make_timestamp(year, month, day, 23, 59, 59)) >= NOW()
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
                AND (
                    visibility_level = 'public'
                    OR visibility_level = 'students_only'
                    OR visibility_level IS NULL
                )
                ORDER BY COALESCE(start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0))
                LIMIT 6
            `;
        }

        return data.rows.map(convertSQLEventToEvent);
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch upcoming events");
    }
}

export async function fetchUserEvents(organiser_uid: string, limit: number = 100, offset: number = 0, includeHidden: boolean = false, reverseOrder: boolean = false) {
    try {
        let events, countResult;

        if (includeHidden && reverseOrder) {
            // Include hidden events, newest first (for account page)
            events = await sql`
                SELECT * FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
                ORDER BY COALESCE(end_datetime, start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0)) DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

            countResult = await sql`
                SELECT COUNT(*) as total FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
            `;
        } else if (includeHidden && !reverseOrder) {
            // Include hidden events, oldest first
            events = await sql`
                SELECT * FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
                ORDER BY COALESCE(end_datetime, start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0)) ASC
                LIMIT ${limit} OFFSET ${offset}
            `;

            countResult = await sql`
                SELECT COUNT(*) as total FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
            `;
        } else if (!includeHidden && reverseOrder) {
            // Exclude hidden events, newest first (for account page if needed)
            events = await sql`
                SELECT * FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
                ORDER BY COALESCE(end_datetime, start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0)) DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

            countResult = await sql`
                SELECT COUNT(*) as total FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
            `;
        } else {
            // Exclude hidden events, newest first (for society pages)
            events = await sql`
                SELECT * FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
                ORDER BY COALESCE(end_datetime, start_datetime, make_timestamp(year, month, day,
                    EXTRACT(hour FROM start_time::time)::int,
                    EXTRACT(minute FROM start_time::time)::int, 0)) DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

            countResult = await sql`
                SELECT COUNT(*) as total FROM events
                WHERE organiser_uid = ${organiser_uid}
                AND (is_deleted IS NULL OR is_deleted = false)
                AND (is_hidden IS NULL OR is_hidden = false)
            `;
        }

        const total = parseInt(countResult.rows[0].total);

        return {
            events: events.rows.map(convertSQLEventToEvent),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + events.rows.length < total
            }
        };
    } catch (error) {
        console.error("Error fetching user events:", error);
        throw new Error("Unable to fetch user's events");
    }
}

export async function fetchEventById(id: string) {
    try {
        const data = await sql<SQLEvent>`
			SELECT e.*, s.slug as organiser_slug
			FROM events e
			LEFT JOIN society_information s ON e.organiser_uid = s.user_id
			WHERE e.id::text LIKE '%' || ${id}
			AND (e.is_deleted IS NULL OR e.is_deleted = false);
		`;

        if (data.rows.length === 0) {
            return null;
        }

        return convertSQLEventToEvent(data.rows[0]);
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch event");
    }
}

export async function fetchHighlightedEvent(eventId: string) {
    try {
        const data = await sql<SQLEvent>`
			SELECT *
			FROM events
			WHERE id = ${eventId}
			AND (is_deleted IS NULL OR is_deleted = false)
			AND (is_hidden IS NULL OR is_hidden = false)
			AND COALESCE(end_datetime, make_timestamp(year, month, day, 23, 59, 59)) >= NOW();
		`;

        if (data.rows.length === 0) {
            return null;
        }

        return convertSQLEventToEvent(data.rows[0]);
    } catch (error) {
        console.error("Database error:", error);
        return null;
    }
}

export async function fetchSQLEventById(id: string) {
    try {
        const data = await sql<SQLEvent>`
			SELECT *
			FROM events
			WHERE id::text LIKE '%' || ${id};
		`;
        return data.rows[0];
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch event");
    }
}

export async function fetchEventWithUserId(event_id: string, user_id: string) {
    try {
        const data = await sql<SQLEvent>`
			SELECT * FROM events
			WHERE organiser_uid = ${user_id} AND id = ${event_id}
			LIMIT 1
		`;
        // console.log("Data rows: ", data.rows);
        if (data.rows.length === 0) {
            return { success: false };
        } else {
            return {
                success: true,
                event: convertSQLEventToEvent(data.rows[0]),
            };
        }
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch event");
    }
}

// base 16 converted uuid is a truncated uuid
export async function fetchBase16ConvertedEventWithUserId(
    event_id: string,
    user_id: string,
) {
    try {
        const pattern = `%${event_id}%`;
        const data = await sql<SQLEvent>`
			SELECT * FROM events
			WHERE organiser_uid = ${user_id} AND id::text LIKE ${pattern}
			LIMIT 1
		`;
        // console.log("Data rows: ", data.rows);
        if (data.rows.length === 0) {
            return { success: false };
        } else {
            return {
                success: true,
                event: convertSQLEventToEvent(data.rows[0]),
            };
        }
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch event");
    }
}

export async function insertEvent(event: SQLEvent) {
    try {
        await sql`
		INSERT INTO events (title, description, organiser, organiser_uid, start_time, end_time, day, month, year, location_building, location_area, location_address, image_url, event_type, sign_up_link, for_externals, capacity, image_contain, send_signup_notifications)
		VALUES (${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid}, ${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year}, ${event.location_building}, ${event.location_area}, ${event.location_address}, ${event.image_url}, ${event.event_type}, ${event.sign_up_link ?? null}, ${event.for_externals ?? null}, ${event.capacity ?? null}, ${event.image_contain}, ${event.send_signup_notifications ?? true})
		`;
        return { success: true };
    } catch (error) {
        console.error("Error creating event:", error);
        return { success: false, error };
    }
}

export async function insertModernEvent(eventData: import('./types').SQLEventData) {
    try {
        // Extract legacy fields from new timestamp fields for backward compatibility
        const startDateTime = new Date(eventData.start_datetime);
        const endDateTime = new Date(eventData.end_datetime);

        const day = startDateTime.getDate();
        const month = startDateTime.getMonth() + 1; // getMonth() returns 0-11
        const year = startDateTime.getFullYear();
        const startTime = `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`;
        const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

        const allowedUniversities = eventData.allowed_universities ?? [];
        const result = await sql`
            INSERT INTO events (
                title, description, organiser, organiser_uid,
                start_datetime, end_datetime, is_multi_day,
                day, month, year, start_time, end_time,
                location_building, location_area, location_address,
                image_url, image_contain, external_forward_email,
                capacity, sign_up_link, for_externals, event_type,
                send_signup_notifications, student_union,
                visibility_level, registration_level, allowed_universities,
                registration_cutoff_hours, external_registration_cutoff_hours
            )
            VALUES (
                ${eventData.title}, ${eventData.description}, ${eventData.organiser}, ${eventData.organiser_uid},
                ${eventData.start_datetime}::timestamptz, ${eventData.end_datetime}::timestamptz, ${eventData.is_multi_day},
                ${day}, ${month}, ${year}, ${startTime}, ${endTime},
                ${eventData.location_building}, ${eventData.location_area}, ${eventData.location_address},
                ${eventData.image_url}, ${eventData.image_contain}, ${eventData.external_forward_email ?? null},
                ${eventData.capacity ?? null}, ${eventData.sign_up_link ?? null}, ${eventData.for_externals ?? null}, ${eventData.event_type},
                ${eventData.send_signup_notifications}, ${eventData.student_union},
                ${eventData.visibility_level ?? 'public'}, ${eventData.registration_level ?? 'public'}, ${allowedUniversities as unknown as string},
                ${eventData.registration_cutoff_hours ?? null}, ${eventData.external_registration_cutoff_hours ?? null}
            )
            RETURNING *
        `;
        return { success: true, event: result.rows[0] };
    } catch (error) {
        console.error("Error creating modern event:", error);
        return { success: false, error: error.message || "Unknown database error" };
    }
}

export async function updateEvent(event: SQLEvent) {
    // console.log('SQL query for ', event.id)
    try {
        await sql`
			UPDATE events
			SET
				title = ${event.title},
				description = ${event.description},
				organiser = ${event.organiser},
				start_time = ${event.start_time},
				end_time = ${event.end_time},
				day = ${event.day},
				month = ${event.month},
				year = ${event.year},
				location_building = ${event.location_building},
				location_area = ${event.location_area},
				location_address = ${event.location_address},
				image_url = ${event.image_url},
				event_type = ${event.event_type},
				sign_up_link = ${event.sign_up_link ?? null},
				for_externals = ${event.for_externals ?? null},
				capacity = ${event.capacity ?? null},
				image_contain = ${event.image_contain},
				send_signup_notifications = ${event.send_signup_notifications ?? true}
			WHERE id = ${event.id}
		`;
        return { message: "succesfully updated database", status: 200 };
    } catch (error) {
        console.error("Error updating event:", error);
        return {
            message: "failed to update database with event",
            status: 500,
            error,
        };
    }
}

export async function deleteEvents(eventIds: string[]): Promise<void> {
    try {
        if (eventIds.length === 0) {
            throw new Error("No event IDs provided for deletion");
        }

        const jsonEventIds = eventIds.map((id) => ({ id }));

        // Use json_populate_recordset to delete the events by ID
        await sql.query(
            `DELETE FROM events
             WHERE id IN (SELECT id FROM json_populate_recordset(NULL::events, $1))`,
            [JSON.stringify(jsonEventIds)],
        );

        console.log(`Deleted ${eventIds.length} events.`);
    } catch (error) {
        console.error("Database error during deletion:", error);
        throw new Error("Failed to delete events");
    }
}

export async function insertContactForm(form: ContactFormInput) {
    try {
        await sql`
		INSERT INTO contact_forms (name, email, message)
		VALUES (${form.name}, ${form.email}, ${form.message})
		`;
        return { success: true };
    } catch (error) {
        console.error("Error adding contact form item:", error);
        return { success: false, error };
    }
}

export async function fetchAllContactForms() {
    try {
        const data = await sql<ContactFormInput>`SELECT * FROM contact_forms`;
        return data.rows;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch contact form data");
    }
}

export async function fetchAccountInfo(id: string) {
    try {
        const data = await sql`
		SELECT logo_url, description, website, tags
		FROM society_information
		WHERE user_id = ${id} 
		LIMIT 1
		`;
        return data.rows[0];
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch account information from users table");
    }
}

export async function fetchAccountLogo(id: string) {
    try {
        const data = await sql`
		SELECT logo_url
		FROM society_information
		WHERE user_id = ${id} 
		LIMIT 1
		`;
        return data.rows[0];
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch account logo from users table");
    }
}

export async function seedPredefinedTags(predefinedTags: Tag[]) {
    try {
        for (const tag of predefinedTags) {
            await sql`
			INSERT INTO tags (label, value)
			VALUES (${tag.label}, ${tag.value})
			ON CONFLICT (value) DO NOTHING
			`;
        }
        console.log("Tags seeded successfully!");
        return { success: true };
    } catch (error) {
        console.error("Error seeding tags:", error);
        throw new Error("Failed to seed tags");
    }
}

export async function fetchPredefinedTags() {
    try {
        // Assuming you have some database query function like `sql`
        const tags = await sql`
            SELECT value, label FROM tags;
        `;

        // Return the fetched tags in the format { value, label }
        return tags.rows.map((tag) => ({
            value: tag.value,
            label: tag.label,
        })) as Tag[];
    } catch (error) {
        console.error("Error fetching predefined tags:", error);
        throw new Error("Failed to fetch predefined tags");
    }
}

export async function updateDescription(id: string, newDescription: string) {
    try {
        await sql`
		UPDATE society_information
		SET description = ${newDescription}
		WHERE user_id = ${id} 
		`;
        return { success: true };
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to update description in users table");
    }
}

export async function updateAccountInfo(
    id: string,
    data: OrganiserAccountEditFormData,
) {
    try {
        // console.log(data.tags); // debugging
        const formattedTags = `{${data.tags.join(",")}}`; // Format as an array string. Below, cast from string[] to text[]
        await sql`
		UPDATE society_information
		SET 
			logo_url = ${data.imageUrl},
			description = ${data.description},
			website = ${data.website},
			tags = ${formattedTags}::integer[]  -- Cast to integer[]
		WHERE user_id = ${id}
	    `;
        return { success: true };
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to update account information in users table");
    }
}

export async function getOrganiser(id: string) {
    try {
        const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url
			FROM users AS u
			JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser' 
			AND u.id=${id}
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
		`;

        return data.rows || null;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to get details for a specific organiser`);
    }
}

export async function getOrganiserName(id: string) {
    try {
        const data = await sql`
			SELECT name
			FROM users
			WHERE role = 'organiser'
			AND id=${id}
			AND name != 'Just A Little Test Society'  -- Exclude the test society
		`;

        return data.rows[0] || null;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to get details for a specific organiser`);
    }
}

export async function getOrganiserBySlug(slug: string) {
    try {
        const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url, society.slug
			FROM users AS u
			JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser'
			AND society.slug = ${slug}
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
		`;

        return data.rows[0] || null;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to get organiser by slug: ${slug}`);
    }
}

export async function getSlugByOrganiserId(id: string) {
    try {
        const data = await sql`
			SELECT slug
			FROM society_information
			WHERE user_id = ${id}
		`;

        return data.rows[0] || null;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to get slug for organiser: ${id}`);
    }
}

export async function checkSlugAvailability(slug: string, excludeUserId?: string) {
    try {
        let data;
        if (excludeUserId) {
            data = await sql`
				SELECT slug FROM society_information
				WHERE slug = ${slug} AND user_id != ${excludeUserId}
				LIMIT 1
			`;
        } else {
            data = await sql`
				SELECT slug FROM society_information
				WHERE slug = ${slug}
				LIMIT 1
			`;
        }

        return data.rows.length === 0; // true if available
    } catch (error) {
        console.error("Error checking slug availability:", error);
        return false;
    }
}

export async function getOrganiserCards(page: number, limit: number) {
    try {
        const offset: number = (page - 1) * limit;

        const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url, society.slug
			FROM users as u
            JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser'
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
			LIMIT ${limit} OFFSET ${offset}
		`;

        return data.rows;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error(
            `Failed to get organiser card details for page ${page.toString()}, and limit ${limit.toString()}`,
        );
    }
}

export async function getAllOrganiserCards() {
    try {
        const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url, society.slug
			FROM users as u
            JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser'
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
		`;

        return data.rows;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to get all organiser card details");
    }
}

// MARK: Insert 'users'
export async function insertUser(formData: UserRegisterFormData) {
    try {
        const hashedPassword = await bcrypt.hash(formData.password, 10);
        const username = `${capitalize(formData.firstname)} ${capitalize(formData.surname)}`;
        // Default to 'student' for student registration form
        const accountType = formData.accountType || 'student';

        const result = await sql`
			INSERT INTO users (name, email, password, account_type)
			VALUES (${username}, ${formData.email}, ${hashedPassword}, ${accountType})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`;

        return { success: true, id: result.rows[0].id };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error };
    }
}

export async function insertOtherUser(formData: Record<string, unknown>) {
    try {
        const hashedPassword = await bcrypt.hash(formData.password as string, 10);
        const username = `${capitalize(formData.firstname as string)} ${capitalize(formData.surname as string)}`;
        const accountType = formData.accountType === 'external' && formData.otherAccountType
            ? formData.otherAccountType
            : formData.accountType;

        const result = await sql`
			INSERT INTO users (name, email, password, account_type)
			VALUES (${username}, ${formData.email as string}, ${hashedPassword}, ${accountType as string})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`;

        if (result.rows.length === 0) {
            return { success: false, error: "Email already exists" };
        }

        const userId = result.rows[0].id;

        // Insert minimal user_information (only user_id and optional self-reported university)
        // Note: verified_university in users table is set separately when they verify their .ac.uk email
        const university = formData.university
            ? selectUniversity(formData.university as string, formData.otherUniversity as string | undefined)
            : null;

        // Only insert into user_information if there's a university affiliation to store
        if (university) {
            await sql`
                INSERT INTO user_information (user_id, university_attended)
                VALUES (${userId}, ${university})
            `;
        } else {
            // Still insert a row with just user_id to maintain referential integrity
            await sql`
                INSERT INTO user_information (user_id)
                VALUES (${userId})
            `;
        }

        return { success: true, id: userId };
    } catch (error) {
        console.error("Error creating other user:", error);
        return { success: false, error };
    }
}

export async function insertUserInformation(
    formData: UserRegisterFormData,
    userId: string,
) {
    const formattedDOB = formatDOB(formData.dob); // Currently just leaves in yyyy-mm-dd form
    const university = selectUniversity(
        formData.university,
        formData.otherUniversity,
    ); // if 'other' selected, uses text input entry
    try {
        await sql`
			INSERT INTO user_information (user_id, gender, birthdate, referrer, university_attended, graduation_year, course, level_of_study, newsletter_subscribe)
        	VALUES (${userId}, ${formData.gender}, ${formattedDOB}, ${formData.referrer}, ${university}, ${formData.graduationYear}, ${formData.degreeCourse}, ${formData.levelOfStudy}, ${formData.isNewsletterSubscribed})
		`;
        return { success: true };
    } catch (error) {
        console.error("Error creating user_information:", error);
        return { success: false, error };
    }
}

export async function getUserUniversityById(user_id: string) {
    try {
        const data = await sql`
			SELECT COALESCE(
				(SELECT university_attended FROM user_information WHERE user_id = ${user_id}),
				(SELECT university_affiliation FROM society_information WHERE user_id = ${user_id})
			) AS university;
		`;
        const result = data.rows.map((it) => it as { university: string }); // we are certain this is a string
        // console.log(result)
        if (result.length === 0) {
            throw new Error(`The user with id ${user_id} does not exist`);
        } else if (result.length !== 1) {
            throw new Error(
                `multiple entries exist for user with id ${user_id}, it is likely the database is corrupted, contact the admin`,
            );
        }

        return { success: true, university: result[0].university };
    } catch (error) {
        console.log(
            `Error getting the university of user with id ${user_id}, ${error}`,
        );
        return { success: false, error };
    }
}

export async function insertOrganiserIntoUsers(
    formData: SocietyRegisterFormData,
) {
    try {
        const hashedPassword = await bcrypt.hash(formData.password, 10);
        const name = properTitleCase(formData.name);

        const result = await sql`
			INSERT INTO users (name, email, password, role)
			VALUES (${name}, ${formData.email}, ${hashedPassword}, ${"organiser"})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`;

        return { success: true, id: result.rows[0].id };
    } catch (error) {
        console.error("Error creating organiser:", error);
        return { success: false, error };
    }
}

export async function insertOrganiserInformation(
    formData: SocietyRegisterFormData,
    userId: string,
) {
    try {
        const formattedTags = `{${formData.tags.join(",")}}`; // Format as an array string. Below, cast from string[] to text[]
        const university = selectUniversity(
            formData.university,
            formData.otherUniversity,
        ); // if 'other' selected, uses text input entry

        await sql`
			INSERT INTO society_information (user_id, slug, logo_url, description, website, tags, university_affiliation, additional_email, phone_number)
			VALUES (${userId}, ${formData.slug}, ${formData.imageUrl}, ${formData.description}, ${formData.website}, ${formattedTags}::integer[], ${university}, ${formData.additionalEmail}, ${formData.phoneNumber})
		`;
        return { success: true };
    } catch (error) {
        console.log("Error creating society_information", error);
        return { success: false, error };
    }
}

export async function getAllCompanyInformation() {
    try {
        const data = await sql`
			SELECT
					c.id,
					u.name AS company_name, 
					COALESCE(c.contact_email, u.email) AS contact_email,
					c.description,
					c.motivation,
					c.contact_name,
					c.website,
					COALESCE(c.logo_url, u.logo_url) AS logo_url
			FROM 
					users AS u 
			JOIN 
					company_information AS c ON u.id = c.user_id
			WHERE 
					u.role = 'company'
			AND u.name != 'TEST COMPANY';
		`;
        return data.rows.map((it) => it as CompanyInformation);
    } catch (error) {
        console.log("Database error:", error);
        throw new Error("Error fetching all company information");
    }
}

export async function insertCompany(formData: CompanyRegisterFormData) {
    try {
        const hashedPassword = await bcrypt.hash(formData.password, 10);
        const name = formData.companyName
            .split(" ")
            .map(capitalizeFirst)
            .join(" ");

        const result = await sql`
			INSERT INTO users (name, email, password, role)
			VALUES (${name}, ${formData.contactEmail}, ${hashedPassword}, ${"company"})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`;
        return { success: true, id: result.rows[0].id };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error };
    }
}

export async function insertCompanyInformation(
    formData: CompanyRegisterFormData,
    companyId: string,
) {
    try {
        const formattedMotivations = `{${formData.motivation.join(",")}}`;
        await sql`
			INSERT INTO company_information (user_id, contact_name, contact_email, description, website, logo_url, motivation)
        	VALUES (${companyId}, ${formData.contactName}, ${formData.contactEmail}, ${formData.description}, ${formData.website}, ${formData.imageUrl}, ${formattedMotivations})
		`;
        return { success: true };
    } catch (error) {
        console.error("Error creating company_information:", error);
        return { success: false, error };
    }
}

// /register/student: Fetches all organisers in order to identify referrers
export async function fetchOrganisers() {
    try {
        const data = await sql<{ name: string }>`
			SELECT name FROM users
			WHERE role = 'organiser' AND name != 'Just A Little Test Society'
		`;
        return data.rows.map((row) => row.name);
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch organisers");
    }
}

export async function updatePassword(email: string, password: string) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await sql`
			UPDATE users
			SET 
				password = ${hashedPassword}
			WHERE email = ${email} --- Email is UNIQUE among users table
		`;
        return { success: true };
    } catch (error) {
        console.error("Error updating user password");
        return { success: false, error };
    }
}

export async function checkSocietyName(name: string) {
    try {
        const societyName = name.split(" ").map(capitalizeFirst).join(" ");
        const result = await sql`
			SELECT name FROM users
			WHERE name = ${societyName}
			LIMIT 1
		`;
        if (result.rows.length > 0) {
            return { success: true, nameTaken: true };
        } else {
            return { success: true, nameTaken: false };
        }
    } catch (error) {
        console.error("Error checking name:", error);
        return { success: false, error };
    }
}

export async function checkOrganisationName(name: string) {
    try {
        const organisationName = name.split(" ").map(capitalizeFirst).join(" ");
        const result = await sql`
			SELECT name FROM users
			WHERE name = ${organisationName} AND role = 'company'
			LIMIT 1
		`;
        if (result.rows.length > 0) {
            return { success: true, nameTaken: true };
        } else {
            return { success: true, nameTaken: false };
        }
    } catch (error) {
        console.error("Error checking name:", error);
        return { success: false, error };
    }
}

export async function checkEmail(email: string) {
    try {
        const result = await sql`
			SELECT id FROM users
			WHERE email = ${email} OR university_email = ${email}
			LIMIT 1
		`;
        if (result.rows.length > 0) {
            return { success: true, emailTaken: true };
        } else {
            return { success: true, emailTaken: false };
        }
    } catch (error) {
        console.error("Error checking email:", error);
        return { success: false, error };
    }
}

export async function getEmailFromId(id: string) {
    try {
        const data = await sql`
			SELECT email
			FROM users
			WHERE role='organiser' and id = ${id} --- we really want to ensure no user email is leaked by accident
			LIMIT 1
		`;

        return data.rows[0] || null;
    } catch (error) {
        console.error("Error checking email:", error);
        throw new Error("Failed to retrieve email for a specific organiser");
    }
}

export async function getEventOrganiserEmail(id: string) {
    try {
        const data = await sql`
			SELECT email
			FROM users
			WHERE id = ${id} --- get email for event organiser regardless of role
			LIMIT 1
		`;

        return data.rows[0] || null;
    } catch (error) {
        console.error("Error checking email:", error);
        throw new Error("Failed to retrieve email for event organiser");
    }
}

export async function checkIfRegistered(event_id: string, user_id: string) {
    try {
        const result = await sql`
			SELECT event_registration_uuid FROM event_registrations
			WHERE event_id = ${event_id} AND user_id = ${user_id}
			LIMIT 1
		`;
        return result.rows.length > 0;
    } catch (error) {
        console.error("Error checking registration status:", error);
        return false; // Assume unregistered
    }
}

export async function registerForEvent(
    user_id: string,
    user_email: string,
    user_name: string,
    event_id: string,
    external: boolean,
) {
    try {
        await sql`
		INSERT INTO event_registrations (event_id, user_id, name, email, external)
		VALUES (${event_id}, ${user_id}, ${user_name}, ${user_email}, ${external})
		`;
        return { success: true };
    } catch (error) {
        console.error("Error registering user for event:", error);
        return { success: false, registered: false };
    }
}

export async function getRegistrationsForEvent(event_id: string) {
    try {
        const result = await sql<SQLRegistrations>`
		SELECT user_id, name, email, created_at, external
		FROM event_registrations
		WHERE event_id = ${event_id}
		`;
        const registrations = result.rows.map(
            convertSQLRegistrationsToRegistrations,
        );
        return { success: true, registrations: registrations };
    } catch (error) {
        return { success: false };
    }
}

export async function findUniqueForgottenPasswordEmails() {
    try {
        const result = await sql`
			SELECT DISTINCT email
			FROM contact_forms
			WHERE email != 'test@lsn.co.uk'
			AND message LIKE 'Forgotten Password request for email%';
		`;

        return result.rows;
    } catch (error) {
        console.error(
            "Error fetching unique forgotten password emails:",
            error,
        );
        return []; // Return empty array on error
    }
}

export async function cleanupForgottenPasswordEmails() {
    try {
        await sql`
			DELETE FROM contact_forms
			WHERE email != 'test@lsn.co.uk'
			AND message LIKE 'Forgotten Password request for email%';
		`;

        return { success: true };
    } catch (error) {
        console.error("Error cleaning up forgotten password emails:", error);
        return { success: false, error: error.message };
    }
}

export async function getAllThreads() {
    try {
        const data = await sql`
			SELECT 
			    id,
				title, 
				content,
				author_id,
				created_at AT TIME ZONE 'UTC' as created_at,
				updated_at AT TIME ZONE 'UTC' as updated_at,
				upvotes,
				downvotes
			FROM threads
			ORDER BY created_at DESC;
		`;
        return data.rows;
    } catch (error) {
        console.error("Error fetching all threads:", error);
        throw new Error("Failed to fetch threads");
    }
}

export async function getUserbyID(userId: string) {
    try {
        const data = await sql`
			SELECT id, name, email
			FROM users
			WHERE id = ${userId}
			LIMIT 1;
		`;
        return data.rows[0];
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw new Error("Failed to fetch user by ID");
    }
}

export async function getTagsbyThreadId(threadId: string) {
    try {
        const data = await sql`
			SELECT ft.id, ft.name
			FROM thread_tags tt
			JOIN forum_tags ft ON tt.forum_tag_id = ft.id
			WHERE tt.thread_id = ${threadId}
			ORDER BY ft.name ASC;
		`;
        return data.rows;
    } catch (error) {
        console.error("Error fetching tags by thread ID:", error);
        throw new Error("Failed to fetch tags for thread");
    }
}

export async function addVotetoThread(
    threadId: string,
    userId: string,
    voteType: "upvote" | "downvote",
) {
    try {
        // First, check if the user has already voted on this thread
        const existingVote = await sql`
      SELECT vote_type FROM thread_votes 
      WHERE thread_id = ${threadId} AND user_id = ${userId}
    `;

        const hasExistingVote = existingVote.rows.length > 0;
        const existingVoteType = hasExistingVote
            ? existingVote.rows[0].vote_type
            : null;

        // Begin transaction
        await sql`BEGIN`;

        if (hasExistingVote) {
            if (existingVoteType === voteType) {
                // User is un-voting (clicking the same button again)

                // Decrement the vote count
                await sql`
		  UPDATE threads
		  SET upvotes = upvotes - 1
		  WHERE id = ${threadId}
		`;

                await sql`
          DELETE FROM thread_votes
          WHERE thread_id = ${threadId} AND user_id = ${userId}
        `;
            } else {
                // User is changing their vote
                await sql`
          UPDATE thread_votes
          SET vote_type = ${voteType}
          WHERE thread_id = ${threadId} AND user_id = ${userId}
        `;

                // Decrement old vote type and increment new vote type
                await sql`
          UPDATE threads
          SET 
            ${existingVoteType === "upvote" ? `upvotes = upvotes - 1` : `downvotes = downvotes - 1`},
            ${voteType === "upvote" ? `upvotes = upvotes + 1` : `downvotes = downvotes + 1`}
          WHERE id = ${threadId}
        `;
            }
        } else {
            // User is voting for the first time
            await sql`
        INSERT INTO thread_votes (thread_id, user_id, vote_type)
        VALUES (${threadId}, ${userId}, ${voteType})
      `;

            // Increment vote count
            await sql`
		UPDATE threads
		SET upvotes = upvotes + 1
		WHERE id = ${threadId}
	`;
        }

        // Commit transaction
        await sql`COMMIT`;

        return { success: true };
    } catch (error) {
        // Rollback on error
        await sql`ROLLBACK`;
        console.error("Error adding vote to thread:", error);
        return { success: false, error };
    }
}

export async function getReplyCountByThreadId(threadId: string) {
    try {
        const data = await sql`
			SELECT COUNT(*) AS reply_count
			FROM comments
			WHERE thread_id = ${threadId} AND parent_id IS NULL;
		`;
        return data.rows[0].reply_count;
    } catch (error) {
        console.error("Error fetching reply count by thread ID:", error);
        throw new Error("Failed to fetch reply count for thread");
    }
}

// Event visibility management functions
export async function hideEvent(eventId: string) {
    try {
        await sql`
            UPDATE events
            SET is_hidden = true
            WHERE id = ${eventId}
        `;
        return { success: true };
    } catch (error) {
        console.error("Error hiding event:", error);
        return { success: false, error };
    }
}

export async function unhideEvent(eventId: string) {
    try {
        await sql`
            UPDATE events
            SET is_hidden = false
            WHERE id = ${eventId}
        `;
        return { success: true };
    } catch (error) {
        console.error("Error unhiding event:", error);
        return { success: false, error };
    }
}

export async function toggleEventVisibility(eventId: string, isHidden: boolean) {
    try {
        await sql`
            UPDATE events
            SET is_hidden = ${isHidden}
            WHERE id = ${eventId}
        `;
        return { success: true };
    } catch (error) {
        console.error("Error toggling event visibility:", error);
        return { success: false, error };
    }
}

export async function softDeleteEvent(eventId: string) {
    try {
        await sql`
            UPDATE events
            SET is_deleted = true,
                deleted_at = NOW()
            WHERE id = ${eventId}
        `;
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false, error };
    }
}

export async function getEventRegistrationStats(eventId: string) {
    try {
        const stats = await sql`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN external = false THEN 1 END) as internal,
                COUNT(CASE WHEN external = true THEN 1 END) as external
            FROM event_registrations
            WHERE event_id = ${eventId}
        `;

        return {
            success: true,
            stats: {
                total: stats.rows[0].total || 0,
                internal: stats.rows[0].internal || 0,
                external: stats.rows[0].external || 0
            }
        };
    } catch (error) {
        console.error("Error fetching registration stats:", error);
        return { success: false, stats: { total: 0, internal: 0, external: 0 } };
    }
}

export async function deregisterFromEvent(event_id: string, user_id: string) {
    try {
        const result = await sql`
            DELETE FROM event_registrations
            WHERE event_id = ${event_id} AND user_id = ${user_id}
        `;

        if (result.rowCount === 0) {
            return { success: false, error: "Registration not found" };
        }

        return { success: true, message: "Successfully deregistered from event" };
    } catch (error) {
        console.error("Error deregistering from event:", error);
        return { success: false, error: "Failed to deregister from event" };
    }
}
