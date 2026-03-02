import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

// POST /api/admin/campaigns/contacts/move - Add contacts to a category
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            return NextResponse.json(
                { error: "Contact IDs are required" },
                { status: 400 }
            );
        }

        const { ids, categoryId, replace } = body;

        if (replace) {
            // Remove existing category links for these contacts
            const idsArray = `{${ids.map((id: string) => `"${id}"`).join(",")}}`;
            await sql`
                DELETE FROM email_contact_categories
                WHERE contact_id = ANY(${idsArray}::uuid[])
            `;
        }

        let movedCount = 0;
        if (categoryId) {
            // Add contacts to the category
            for (const contactId of ids) {
                const result = await sql`
                    INSERT INTO email_contact_categories (contact_id, category_id)
                    VALUES (${contactId}::uuid, ${categoryId}::uuid)
                    ON CONFLICT DO NOTHING
                `;
                movedCount += result.rowCount || 0;
            }
        }

        // Update timestamps
        const idsArray = `{${ids.map((id: string) => `"${id}"`).join(",")}}`;
        await sql`
            UPDATE email_contacts SET updated_at = NOW()
            WHERE id = ANY(${idsArray}::uuid[])
        `;

        return NextResponse.json({
            success: true,
            movedCount,
        });
    } catch (error) {
        console.error("Error moving contacts:", error);
        return NextResponse.json(
            { error: "Failed to move contacts" },
            { status: 500 }
        );
    }
}
