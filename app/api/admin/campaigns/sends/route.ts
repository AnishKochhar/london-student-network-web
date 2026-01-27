import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

interface EmailSendDetail {
    id: string;
    toEmail: string;
    toName: string | null;
    toOrganization: string | null;
    subject: string;
    status: string;
    sentAt: string | null;
    errorMessage: string | null;
}

// GET /api/admin/campaigns/sends?id={campaignId}&status={status} - Get individual email send details
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("id");
        const statusFilter = searchParams.get("status");

        if (!campaignId) {
            return NextResponse.json(
                { error: "Campaign ID required" },
                { status: 400 }
            );
        }

        let sends: EmailSendDetail[];

        if (statusFilter) {
            const { rows } = await sql`
                SELECT id, to_email, to_name, to_organization, subject, status, sent_at, error_message
                FROM email_sends
                WHERE campaign_id = ${campaignId}::uuid AND status = ${statusFilter}
                ORDER BY updated_at DESC
                LIMIT 200
            `;
            sends = rows.map(formatSendRow);
        } else {
            const { rows } = await sql`
                SELECT id, to_email, to_name, to_organization, subject, status, sent_at, error_message
                FROM email_sends
                WHERE campaign_id = ${campaignId}::uuid
                ORDER BY updated_at DESC
                LIMIT 200
            `;
            sends = rows.map(formatSendRow);
        }

        return NextResponse.json({ sends });
    } catch (error) {
        console.error("Error fetching campaign sends:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch sends" },
            { status: 500 }
        );
    }
}

function formatSendRow(row: Record<string, unknown>): EmailSendDetail {
    return {
        id: row.id as string,
        toEmail: row.to_email as string,
        toName: row.to_name as string | null,
        toOrganization: row.to_organization as string | null,
        subject: row.subject as string,
        status: row.status as string,
        sentAt: row.sent_at as string | null,
        errorMessage: row.error_message as string | null,
    };
}
