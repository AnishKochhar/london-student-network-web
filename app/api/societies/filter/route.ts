import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { TAG_CATEGORIES } from "@/app/utils/tag-categories";


export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
		const tags = searchParams.get('tags')?.split(',').map(Number).filter(Boolean) || [];
		const search = searchParams.get('search') || '';
		const university = searchParams.get('university') || '';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const offset = (page - 1) * limit;

		// Convert selected categories to their component tags
		let allFilterTags = [...tags];
		if (categories.length > 0) {
			categories.forEach(categoryId => {
				const category = TAG_CATEGORIES.find(cat => cat.id === categoryId);
				if (category) {
					const categoryTags = category.tags.map(tag => tag.value);
					allFilterTags = [...allFilterTags, ...categoryTags];
				}
			});
		}

		// Remove duplicates
		allFilterTags = [...new Set(allFilterTags)];

		// Build the WHERE clause dynamically
		const whereConditions: string[] = [];
		const queryParams: (string | number | string[] | number[])[] = [];
		let paramIndex = 1;

		// Base condition - only show organiser accounts and non-hidden societies
		whereConditions.push(`u.role = 'organiser'`);
		whereConditions.push(`(si.hidden IS NULL OR si.hidden = FALSE)`);

		// Search condition (name or description)
		if (search.trim()) {
			whereConditions.push(`(
        LOWER(u.name) LIKE LOWER($${paramIndex}) OR
        LOWER(si.description) LIKE LOWER($${paramIndex + 1})
      )`);
			const searchPattern = `%${search.trim()}%`;
			queryParams.push(searchPattern, searchPattern);
			paramIndex += 2;
		}

		// Tag filtering - check if any of the specified tags exist in the society's tags array
		if (allFilterTags.length > 0) {
			whereConditions.push(`si.tags && $${paramIndex}::integer[]`);
			queryParams.push(allFilterTags);
			paramIndex++;
		}

		// University filtering
		if (university.trim()) {
			whereConditions.push(`LOWER(si.university_affiliation) LIKE LOWER($${paramIndex})`);
			queryParams.push(`%${university.trim()}%`);
			paramIndex++;
		}

		const whereClause = whereConditions.length > 0
			? `WHERE ${whereConditions.join(' AND ')}`
			: '';

		// Get total count for pagination
		const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN society_information si ON u.id = si.user_id
      ${whereClause}
    `;

		const countResult = await sql.query(countQuery, queryParams);
		const totalSocieties = parseInt(countResult.rows[0].total);

		// Main query to fetch societies with priority ordering
		const mainQuery = `
      SELECT
        u.id,
        u.name,
        si.logo_url,
        si.description,
        si.website,
        si.tags,
        si.university_affiliation,
        si.priority
      FROM users u
      LEFT JOIN society_information si ON u.id = si.user_id
      ${whereClause}
      ORDER BY
        COALESCE(si.priority, 2) DESC,
        RANDOM()
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

		queryParams.push(limit, offset);

		const result = await sql.query(mainQuery, queryParams);

		// Format the response
		const societies = result.rows.map(row => ({
			id: row.id,
			name: row.name,
			description: row.description || null,
			website: row.website || null,
			logo_url: row.logo_url || null,
			tags: row.tags || [],
			university: row.university_affiliation || null,
			keywords: [] // For backwards compatibility
		}));

		return NextResponse.json({
			success: true,
			societies,
			pagination: {
				page,
				limit,
				total: totalSocieties,
				totalPages: Math.ceil(totalSocieties / limit),
				hasMore: offset + societies.length < totalSocieties
			},
			filters: {
				categories,
				tags,
				search,
				university
			}
		});

	} catch (error) {
		console.error("Error filtering societies:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to filter societies",
				societies: [],
				pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
			},
			{ status: 500 }
		);
	}
}

// Get popular tags based on usage
export async function POST(request: NextRequest) {
	try {
		const { action } = await request.json();

		if (action === 'popular-tags') {
			// Get most commonly used tags
			const result = await sql`
        SELECT tag_value, COUNT(*) as usage_count
        FROM (
          SELECT UNNEST(tags) as tag_value
          FROM society_information
          WHERE tags IS NOT NULL
        ) tag_counts
        GROUP BY tag_value
        ORDER BY usage_count DESC
        LIMIT 10
      `;

			return NextResponse.json({
				success: true,
				popularTags: result.rows
			});
		}

		if (action === 'universities') {
			// Get list of universities
			const result = await sql`
        SELECT DISTINCT university_affiliation as university
        FROM society_information
        WHERE university_affiliation IS NOT NULL
        AND TRIM(university_affiliation) != ''
        ORDER BY university_affiliation ASC
      `;

			return NextResponse.json({
				success: true,
				universities: result.rows.map(row => row.university)
			});
		}

		return NextResponse.json(
			{ success: false, error: "Invalid action" },
			{ status: 400 }
		);

	} catch (error) {
		console.error("Error in POST handler:", error);
		return NextResponse.json(
			{ success: false, error: "Server error" },
			{ status: 500 }
		);
	}
}