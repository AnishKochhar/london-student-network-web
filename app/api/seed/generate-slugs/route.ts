import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { generateSlugFromName } from "@/app/lib/utils";

/**
 * Migration route to generate slugs for existing societies
 * POST /api/seed/generate-slugs
 *
 * This should be run ONCE after deploying the slug feature
 * It will:
 * 1. Fetch all societies without slugs
 * 2. Generate unique slugs for each
 * 3. Handle collisions by appending numbers
 * 4. Update the database
 */
export async function POST(request: Request) {
    try {
        // Fetch all societies that don't have slugs yet
        const societies = await sql`
            SELECT u.id, u.name
            FROM users u
            LEFT JOIN society_information si ON u.id = si.user_id
            WHERE u.role = 'organiser'
            AND (si.slug IS NULL OR si.slug = '')
            ORDER BY u.name
        `;

        if (societies.rows.length === 0) {
            return NextResponse.json({
                success: true,
                message: "All societies already have slugs",
                count: 0,
                slugs: [],
            });
        }

        const slugMap = new Map<string, number>();
        const results = [];

        for (const society of societies.rows) {
            try {
                let slug = generateSlugFromName(society.name);
                let finalSlug = slug;

                // Handle collisions
                if (slugMap.has(slug)) {
                    const count = slugMap.get(slug)! + 1;
                    slugMap.set(slug, count);
                    finalSlug = `${slug}-${count}`;
                } else {
                    // Check if slug exists in database
                    const existing = await sql`
                        SELECT slug FROM society_information
                        WHERE slug = ${slug}
                        LIMIT 1
                    `;

                    if (existing.rows.length > 0) {
                        // Slug exists, find next available number
                        let counter = 2;
                        let tempSlug = `${slug}-${counter}`;

                        while (true) {
                            const check = await sql`
                                SELECT slug FROM society_information
                                WHERE slug = ${tempSlug}
                                LIMIT 1
                            `;

                            if (check.rows.length === 0) {
                                finalSlug = tempSlug;
                                break;
                            }
                            counter++;
                            tempSlug = `${slug}-${counter}`;
                        }
                        slugMap.set(slug, counter);
                    } else {
                        slugMap.set(slug, 1);
                    }
                }

                // Update the database
                await sql`
                    INSERT INTO society_information (user_id, slug)
                    VALUES (${society.id}, ${finalSlug})
                    ON CONFLICT (user_id)
                    DO UPDATE SET slug = ${finalSlug}
                `;

                results.push({
                    id: society.id,
                    name: society.name,
                    slug: finalSlug,
                });

                console.log(`Generated slug for ${society.name}: ${finalSlug}`);
            } catch (error) {
                console.error(`Error generating slug for ${society.name}:`, error);
                results.push({
                    id: society.id,
                    name: society.name,
                    slug: null,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${results.filter(r => r.slug).length} slugs`,
            count: results.length,
            slugs: results,
        });
    } catch (error) {
        console.error("Error in slug generation:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate slugs",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// Also allow GET for browser access
export async function GET(request: Request) {
    return POST(request);
}
