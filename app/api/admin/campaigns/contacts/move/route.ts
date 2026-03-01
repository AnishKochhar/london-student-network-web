import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

// POST /api/admin/campaigns/contacts/move - Move contacts to a new category
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

        const { ids, categoryId } = body;

        // Convert array to PostgreSQL array format
        const idsArray = `{${ids.map((id: string) => `"${id}"`).join(",")}}`;

        // Update all contacts to the new category
        const result = await sql`
            UPDATE email_contacts
            SET
                category_id = ${categoryId || null},
                updated_at = NOW()
            WHERE id = ANY(${idsArray}::uuid[])
            RETURNING id
        `;

        return NextResponse.json({
            success: true,
            movedCount: result.rowCount,
        });
    } catch (error) {
        console.error("Error moving contacts:", error);
        return NextResponse.json(
            { error: "Failed to move contacts" },
            { status: 500 }
        );
    }
}
