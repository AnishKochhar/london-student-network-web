import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";
import { sendEventReportEmail } from "@/app/lib/send-email";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

export async function POST(req: Request) {
    try {
        // Rate limiting for report submissions (strict limits to prevent abuse)
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.email);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        const session = await auth();
        const { event_id, reason, additional_details, reporter_name, reporter_email } = await req.json();

        // Validate required fields
        if (!event_id || !reason) {
            return NextResponse.json(
                { success: false, error: "Event ID and reason are required" },
                { status: 400 }
            );
        }

        // For guests, name and email are required
        if (!session?.user?.id && (!reporter_name || !reporter_email)) {
            return NextResponse.json(
                { success: false, error: "Name and email are required for guest reports" },
                { status: 400 }
            );
        }

        // Validate email format for guests
        if (reporter_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(reporter_email)) {
                return NextResponse.json(
                    { success: false, error: "Invalid email format" },
                    { status: 400 }
                );
            }
        }

        // Fetch event details to include in the report
        const eventResult = await sql`
            SELECT id, title
            FROM events
            WHERE id = ${event_id}
            AND (is_deleted IS NULL OR is_deleted = false)
        `;

        if (eventResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        const event = eventResult.rows[0];

        // Insert report into database
        const reportResult = await sql`
            INSERT INTO event_reports (
                event_id,
                reporter_name,
                reporter_email,
                reporter_user_id,
                reason,
                additional_details,
                status
            ) VALUES (
                ${event_id},
                ${reporter_name || null},
                ${reporter_email || null},
                ${session?.user?.id || null},
                ${reason},
                ${additional_details || null},
                'pending'
            )
            RETURNING id
        `;

        const reportId = reportResult.rows[0].id;

        // Generate event URL
        const eventUrl = `${process.env.NEXTAUTH_URL || 'https://londonstudentnetwork.com'}/events/${base16ToBase62(event_id)}`;

        // Send email notification
        try {
            await sendEventReportEmail({
                eventTitle: event.title,
                eventId: event_id,
                eventUrl,
                reporterName: reporter_name,
                reporterEmail: reporter_email,
                reporterUserId: session?.user?.id,
                reason,
                additionalDetails: additional_details,
                reportId,
            });
        } catch (emailError) {
            console.error("Failed to send report email, but report was saved:", emailError);
            // Don't fail the request if email fails - the report is still saved
        }

        return NextResponse.json({
            success: true,
            message: "Report submitted successfully",
            report_id: reportId,
        });

    } catch (error) {
        console.error("Error submitting event report:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit report" },
            { status: 500 }
        );
    }
}
