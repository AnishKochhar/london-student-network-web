import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    fetchTemplates,
    fetchTemplateById,
    fetchTemplateBySlug,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchSignatures,
} from "@/app/lib/campaigns/queries";
import {
    wrapWithLSNBranding,
    replaceVariables,
    extractVariables,
    htmlToPlainText,
} from "@/app/lib/campaigns/email-templates";

// GET /api/admin/campaigns/templates - List all templates
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const slug = searchParams.get("slug");
        const preview = searchParams.get("preview") === "true";
        const includeSignatures = searchParams.get("includeSignatures") === "true";

        // Fetch single template by ID
        if (id) {
            const template = await fetchTemplateById(id);
            if (!template) {
                return NextResponse.json(
                    { error: "Template not found" },
                    { status: 404 }
                );
            }

            // If preview requested, wrap with branding
            if (preview) {
                const previewVariables: Record<string, string> = {
                    name: "John",
                    organization: "Example Society",
                    email: "john@example.com",
                };
                const processedBody = replaceVariables(template.bodyHtml, previewVariables);
                const fullHtml = wrapWithLSNBranding(processedBody, { name: "Josh", title: "CEO, LSN" }, {
                    previewText: template.previewText || undefined,
                    unsubscribeUrl: "https://londonstudentnetwork.com/unsubscribe?token=preview",
                });
                return NextResponse.json({
                    template,
                    previewHtml: fullHtml,
                });
            }

            return NextResponse.json(template);
        }

        // Fetch single template by slug
        if (slug) {
            const template = await fetchTemplateBySlug(slug);
            if (!template) {
                return NextResponse.json(
                    { error: "Template not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(template);
        }

        // Fetch all templates
        const templates = await fetchTemplates();

        // Optionally include signatures
        if (includeSignatures) {
            const signatures = await fetchSignatures();
            return NextResponse.json({ templates, signatures });
        }

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json(
            { error: "Failed to fetch templates" },
            { status: 500 }
        );
    }
}

// POST /api/admin/campaigns/templates - Create a new template
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.subject || !body.bodyHtml) {
            return NextResponse.json(
                { error: "Name, subject, and body are required" },
                { status: 400 }
            );
        }

        // Generate slug if not provided
        const slug = body.slug || body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check for duplicate slug
        const existing = await fetchTemplateBySlug(slug);
        if (existing) {
            return NextResponse.json(
                { error: "A template with this slug already exists" },
                { status: 409 }
            );
        }

        // Extract variables from body if not provided
        const variables = body.variables || extractVariables(body.bodyHtml + body.subject);

        // Generate plain text version if not provided
        const bodyText = body.bodyText || htmlToPlainText(body.bodyHtml);

        const template = await createTemplate({
            name: body.name,
            slug,
            description: body.description,
            subject: body.subject,
            bodyHtml: body.bodyHtml,
            bodyText,
            variables,
            signatureId: body.signatureId,
            category: body.category,
            previewText: body.previewText,
            createdBy: session.user.id,
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error("Error creating template:", error);

        if (error instanceof Error && error.message.includes("unique")) {
            return NextResponse.json(
                { error: "A template with this slug already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create template" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/campaigns/templates - Update a template
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        // Check template exists
        const existing = await fetchTemplateById(body.id);
        if (!existing) {
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        // If updating bodyHtml, recalculate variables
        let variables = body.variables;
        if (body.bodyHtml && !body.variables) {
            variables = extractVariables(body.bodyHtml + (body.subject || existing.subject));
        }

        // If updating bodyHtml, regenerate plain text
        let bodyText = body.bodyText;
        if (body.bodyHtml && !body.bodyText) {
            bodyText = htmlToPlainText(body.bodyHtml);
        }

        const template = await updateTemplate(body.id, {
            name: body.name,
            slug: body.slug,
            description: body.description,
            subject: body.subject,
            bodyHtml: body.bodyHtml,
            bodyText,
            variables,
            signatureId: body.signatureId,
            category: body.category,
            isActive: body.isActive,
            previewText: body.previewText,
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json(
            { error: "Failed to update template" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/campaigns/templates - Delete a template
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        // Check template exists
        const existing = await fetchTemplateById(body.id);
        if (!existing) {
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        // Hard delete only if explicitly requested
        await deleteTemplate(body.id, body.hardDelete === true);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting template:", error);
        return NextResponse.json(
            { error: "Failed to delete template" },
            { status: 500 }
        );
    }
}
