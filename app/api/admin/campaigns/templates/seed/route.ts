import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTemplate, fetchTemplateBySlug } from "@/app/lib/campaigns/queries";
import {
    SOCIETY_OUTREACH_TEMPLATES,
    templateContentToEmailTemplate,
} from "@/app/lib/campaigns/email-templates";

// POST /api/admin/campaigns/templates/seed - Seed pre-built templates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const results = {
            created: [] as string[],
            skipped: [] as string[],
            errors: [] as { slug: string; error: string }[],
        };

        for (const templateContent of SOCIETY_OUTREACH_TEMPLATES) {
            try {
                // Check if template already exists
                const existing = await fetchTemplateBySlug(templateContent.slug);
                if (existing) {
                    results.skipped.push(templateContent.slug);
                    continue;
                }

                // Convert to EmailTemplate format and create
                const templateData = templateContentToEmailTemplate(
                    templateContent,
                    undefined, // No signature ID for now
                    session.user.id
                );

                await createTemplate({
                    name: templateData.name,
                    slug: templateData.slug,
                    description: templateData.description,
                    subject: templateData.subject,
                    bodyHtml: templateData.bodyHtml,
                    bodyText: templateData.bodyText,
                    variables: templateData.variables,
                    signatureId: templateData.signatureId,
                    category: templateData.category,
                    previewText: templateData.previewText,
                    createdBy: templateData.createdBy,
                });

                results.created.push(templateContent.slug);
            } catch (error) {
                results.errors.push({
                    slug: templateContent.slug,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${results.created.length} templates, skipped ${results.skipped.length} existing`,
            results,
        });
    } catch (error) {
        console.error("Error seeding templates:", error);
        return NextResponse.json(
            { error: "Failed to seed templates" },
            { status: 500 }
        );
    }
}
