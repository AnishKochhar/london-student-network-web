import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { duplicateTemplate, fetchTemplateBySlug } from "@/app/lib/campaigns/queries";

// POST /api/admin/campaigns/templates/duplicate - Duplicate a template
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.id || !body.name) {
            return NextResponse.json(
                { error: "Template ID and new name are required" },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = body.slug || body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check slug doesn't exist
        const existing = await fetchTemplateBySlug(slug);
        if (existing) {
            return NextResponse.json(
                { error: "A template with this slug already exists" },
                { status: 409 }
            );
        }

        const template = await duplicateTemplate(body.id, body.name, slug);

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error("Error duplicating template:", error);

        if (error instanceof Error && error.message === "Template not found") {
            return NextResponse.json(
                { error: "Original template not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Failed to duplicate template" },
            { status: 500 }
        );
    }
}
