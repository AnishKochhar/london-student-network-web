import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { verifyUnsubscribeSignature } from "@/app/lib/campaigns/unsubscribe";

interface UnsubscribeRequest {
    contactId: string;
    signature: string;
    reason?: string;
}

// POST /api/unsubscribe — Process an unsubscribe request (from the page)
export async function POST(request: NextRequest) {
    try {
        const body: UnsubscribeRequest = await request.json();
        const { contactId, signature, reason } = body;

        if (!contactId || !signature) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Look up the contact to get their email for signature verification
        const contactResult = await sql`
            SELECT id, email, status FROM email_contacts WHERE id = ${contactId}::uuid
        `;

        if (contactResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        const contact = contactResult.rows[0];

        // Verify the HMAC signature
        if (!verifyUnsubscribeSignature(contactId, contact.email, signature)) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 403 }
            );
        }

        // Already unsubscribed
        if (contact.status === "unsubscribed") {
            return NextResponse.json({
                success: true,
                alreadyUnsubscribed: true,
                email: contact.email,
            });
        }

        // Update contact status
        await sql`
            UPDATE email_contacts
            SET status = 'unsubscribed',
                unsubscribed_at = NOW(),
                updated_at = NOW(),
                notes = CASE
                    WHEN ${reason || null} IS NOT NULL
                    THEN COALESCE(notes, '') || E'\n' || 'Unsubscribe reason: ' || ${reason || ""}
                    ELSE notes
                END
            WHERE id = ${contactId}::uuid
        `;

        return NextResponse.json({
            success: true,
            email: contact.email,
        });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        return NextResponse.json(
            { error: "Failed to process unsubscribe request" },
            { status: 500 }
        );
    }
}

// GET /api/unsubscribe — Verify a link and return contact info (used by the page to load state)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const contactId = searchParams.get("id");
        const signature = searchParams.get("sig");

        if (!contactId || !signature) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Look up the contact
        const contactResult = await sql`
            SELECT id, email, name, status FROM email_contacts WHERE id = ${contactId}::uuid
        `;

        if (contactResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        const contact = contactResult.rows[0];

        // Verify the HMAC signature
        if (!verifyUnsubscribeSignature(contactId, contact.email, signature)) {
            return NextResponse.json(
                { error: "Invalid link" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            valid: true,
            email: contact.email,
            name: contact.name,
            status: contact.status,
        });
    } catch (error) {
        console.error("Unsubscribe verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify link" },
            { status: 500 }
        );
    }
}
