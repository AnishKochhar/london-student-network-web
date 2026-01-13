import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: "Missing session_id parameter" },
                { status: 400 }
            );
        }

        // Fetch donation details
        const result = await sql`
            SELECT
                sd.amount,
                sd.fee_covered,
                sd.donor_email,
                sd.payment_status,
                u.name as society_name
            FROM society_donations sd
            JOIN users u ON sd.society_uid = u.id
            WHERE sd.stripe_checkout_session_id = ${sessionId}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Donation not found" },
                { status: 404 }
            );
        }

        const donation = result.rows[0];

        return NextResponse.json({
            success: true,
            donation: {
                amount: donation.amount,
                fee_covered: donation.fee_covered,
                donor_email: donation.donor_email,
                society_name: donation.society_name,
                payment_status: donation.payment_status,
            },
        });

    } catch (error) {
        console.error("Error verifying donation:", error);
        return NextResponse.json(
            { success: false, error: "Failed to verify donation" },
            { status: 500 }
        );
    }
}
