import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

/**
 * Lightweight society search for co-host autocomplete.
 * Returns minimal data (id, name, logo, university, slug) for fast rendering.
 *
 * Query params:
 *   q     - search term (required, min 2 chars)
 *   limit - max results (default 8, max 20)
 *   exclude - comma-separated user IDs to exclude from results
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q")?.trim();
        const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20);
        const excludeParam = searchParams.get("exclude") || "";
        const excludeIds = excludeParam
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (!query || query.length < 2) {
            return NextResponse.json({ societies: [] });
        }

        const searchPattern = `%${query}%`;
        const prefixPattern = `${query}%`;

        // Build exclude filter dynamically
        // We can't easily parameterize an IN clause with @vercel/postgres,
        // so we filter in application code for simplicity and safety
        const result = await sql`
            SELECT
                u.id as user_id,
                u.name,
                si.logo_url,
                si.university_affiliation,
                si.slug
            FROM users u
            LEFT JOIN society_information si ON u.id = si.user_id
            WHERE u.role = 'organiser'
            AND (si.hidden IS NULL OR si.hidden = FALSE)
            AND LOWER(u.name) LIKE LOWER(${searchPattern})
            ORDER BY
                CASE
                    WHEN LOWER(u.name) = LOWER(${query}) THEN 0
                    WHEN LOWER(u.name) LIKE LOWER(${prefixPattern}) THEN 1
                    ELSE 2
                END,
                u.name ASC
            LIMIT ${limit + excludeIds.length}
        `;

        // Filter out excluded IDs in application code
        const filtered = excludeIds.length > 0
            ? result.rows.filter((row) => !excludeIds.includes(row.user_id))
            : result.rows;

        return NextResponse.json({
            societies: filtered.slice(0, limit),
        });
    } catch (error) {
        console.error("Error searching societies:", error);
        return NextResponse.json(
            { error: "Failed to search societies" },
            { status: 500 }
        );
    }
}
