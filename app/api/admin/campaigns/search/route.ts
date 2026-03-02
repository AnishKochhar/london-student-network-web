import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

interface CategoryResult {
    type: "category";
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parentName: string | null;
    contactCount: number;
    color: string;
    path: string[];
}

interface ContactResult {
    type: "contact";
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    categories: { id: string; name: string }[];
}

type SearchResult = CategoryResult | ContactResult;

// GET /api/admin/campaigns/search - Unified search for categories and contacts
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("q") || "";
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [], categories: [], contacts: [] });
        }

        const searchPattern = `%${query}%`;

        // Search categories
        const categoriesResult = await sql`
            WITH RECURSIVE category_path AS (
                SELECT
                    id, name, slug, parent_id, color,
                    ARRAY[name] as path,
                    name as full_path
                FROM email_categories
                WHERE parent_id IS NULL
                UNION ALL
                SELECT
                    c.id, c.name, c.slug, c.parent_id, c.color,
                    cp.path || c.name,
                    cp.full_path || ' > ' || c.name
                FROM email_categories c
                INNER JOIN category_path cp ON c.parent_id = cp.id
            )
            SELECT
                cp.id, cp.name, cp.slug, cp.parent_id, cp.color, cp.path,
                p.name as parent_name,
                COUNT(DISTINCT ec.id) as contact_count
            FROM category_path cp
            LEFT JOIN email_categories p ON cp.parent_id = p.id
            LEFT JOIN email_contact_categories ecc ON ecc.category_id = cp.id
            LEFT JOIN email_contacts ec ON ec.id = ecc.contact_id AND ec.status = 'active'
            WHERE cp.name ILIKE ${searchPattern}
            GROUP BY cp.id, cp.name, cp.slug, cp.parent_id, cp.color, cp.path, p.name
            ORDER BY contact_count DESC
            LIMIT ${limit}
        `;

        // Search contacts
        const contactsResult = await sql`
            SELECT
                c.id, c.email, c.name, c.organization,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', cat.id, 'name', cat.name))
                     FROM email_contact_categories ecc2
                     JOIN email_categories cat ON cat.id = ecc2.category_id
                     WHERE ecc2.contact_id = c.id),
                    '[]'::json
                ) as categories
            FROM email_contacts c
            WHERE c.status = 'active'
            AND (
                c.email ILIKE ${searchPattern}
                OR c.name ILIKE ${searchPattern}
                OR c.organization ILIKE ${searchPattern}
            )
            ORDER BY
                CASE WHEN c.email ILIKE ${searchPattern} THEN 0 ELSE 1 END,
                c.name ASC
            LIMIT ${limit}
        `;

        const categories: CategoryResult[] = categoriesResult.rows.map((row) => ({
            type: "category" as const,
            id: row.id,
            name: row.name,
            slug: row.slug,
            parentId: row.parent_id,
            parentName: row.parent_name,
            contactCount: parseInt(row.contact_count) || 0,
            color: row.color || "#6366f1",
            path: row.path || [row.name],
        }));

        const contacts: ContactResult[] = contactsResult.rows.map((row) => ({
            type: "contact" as const,
            id: row.id,
            email: row.email,
            name: row.name,
            organization: row.organization,
            categories: row.categories || [],
        }));

        // Combine and interleave results (categories first, then contacts)
        const results: SearchResult[] = [...categories, ...contacts];

        return NextResponse.json({
            results,
            categories,
            contacts,
        });
    } catch (error) {
        console.error("Error searching:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Search failed" },
            { status: 500 }
        );
    }
}
