import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

interface SendRow {
    id: string;
    campaign_id: string;
    campaign_name: string;
    to_email: string;
    to_name: string | null;
    to_organization: string | null;
    subject: string;
    status: string;
    sent_at: string;
    delivered_at: string | null;
    first_opened_at: string | null;
    open_count: number;
    click_count: number;
}

// GET /api/admin/campaigns/history - Get email send history
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const campaignId = searchParams.get("campaignId") || "";

        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions: string[] = ["es.sent_at IS NOT NULL"];
        const params: (string | number)[] = [];

        if (search) {
            params.push(`%${search}%`);
            const searchIndex = params.length;
            conditions.push(`(es.to_email ILIKE $${searchIndex} OR es.to_name ILIKE $${searchIndex} OR es.to_organization ILIKE $${searchIndex})`);
        }

        if (status) {
            params.push(status);
            conditions.push(`es.status = $${params.length}`);
        }

        if (campaignId) {
            params.push(campaignId);
            conditions.push(`es.campaign_id = $${params.length}::uuid`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Get total count
        const countResult = await sql.query(
            `SELECT COUNT(*) as total FROM email_sends es ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].total);

        // Get sends with campaign info
        const sendsResult = await sql.query(
            `SELECT
                es.id,
                es.campaign_id,
                ec.name as campaign_name,
                es.to_email,
                es.to_name,
                es.to_organization,
                es.subject,
                es.status,
                es.sent_at,
                es.delivered_at,
                es.first_opened_at,
                COALESCE(es.open_count, 0) as open_count,
                COALESCE(es.click_count, 0) as click_count
            FROM email_sends es
            LEFT JOIN email_campaigns ec ON es.campaign_id = ec.id
            ${whereClause}
            ORDER BY es.sent_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        const sends = sendsResult.rows.map((row: SendRow) => ({
            id: row.id,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name || "Unknown Campaign",
            toEmail: row.to_email,
            toName: row.to_name,
            toOrganization: row.to_organization,
            subject: row.subject,
            status: row.status,
            sentAt: row.sent_at,
            deliveredAt: row.delivered_at,
            firstOpenedAt: row.first_opened_at,
            openCount: row.open_count,
            clickCount: row.click_count,
        }));

        return NextResponse.json({
            items: sends,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch history" },
            { status: 500 }
        );
    }
}
