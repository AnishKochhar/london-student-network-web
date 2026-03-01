import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { sendEventRegistrationEmail } from "@/app/lib/send-email";

/**
 * Co-host management endpoint.
 * Only accessible by the primary organiser (or co-hosts with can_edit).
 *
 * Actions: add, remove, update
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const { action, event_id } = body;

        if (!event_id || !action) {
            return NextResponse.json({ error: "event_id and action are required" }, { status: 400 });
        }

        // Check permission: must be primary organiser or co-host with can_edit
        const permCheck = await sql`
            SELECT role, can_edit FROM event_cohosts
            WHERE event_id = ${event_id} AND user_id = ${session.user.id} AND status = 'accepted'
            LIMIT 1
        `;
        if (permCheck.rows.length === 0) {
            return NextResponse.json({ error: "You don't have permission to manage this event" }, { status: 403 });
        }
        const { role, can_edit } = permCheck.rows[0];
        if (role !== 'primary' && !can_edit) {
            return NextResponse.json({ error: "You don't have permission to manage co-hosts" }, { status: 403 });
        }

        switch (action) {
            case "add": {
                const { user_id, permissions } = body;
                if (!user_id) {
                    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
                }

                // Verify target user exists and is an organiser
                const targetUser = await sql`
                    SELECT id, name, email FROM users WHERE id = ${user_id} AND role = 'organiser'
                `;
                if (targetUser.rows.length === 0) {
                    return NextResponse.json({ error: "User not found or is not an organiser" }, { status: 404 });
                }

                const invitationToken = randomUUID().replace(/-/g, '');

                await sql`
                    INSERT INTO event_cohosts (
                        event_id, user_id, role, status, invitation_token, display_order, is_visible,
                        can_edit, can_manage_registrations, can_manage_guests, can_view_insights,
                        receives_registration_emails, receives_summary_emails,
                        receives_payments, added_by
                    ) VALUES (
                        ${event_id}, ${user_id}, 'cohost', 'pending', ${invitationToken},
                        COALESCE((SELECT MAX(display_order) + 1 FROM event_cohosts WHERE event_id = ${event_id}), 1),
                        TRUE,
                        ${permissions?.can_edit ?? false},
                        ${permissions?.can_manage_registrations ?? true},
                        ${permissions?.can_manage_guests ?? true},
                        ${permissions?.can_view_insights ?? true},
                        ${permissions?.receives_registration_emails ?? true},
                        ${permissions?.receives_summary_emails ?? true},
                        ${permissions?.receives_payments ?? false},
                        ${session.user.id}
                    )
                    ON CONFLICT (event_id, user_id) DO NOTHING
                `;

                // Send invitation email
                try {
                    const eventResult = await sql`SELECT title, organiser FROM events WHERE id = ${event_id}`;
                    const eventTitle = eventResult.rows[0]?.title || 'an event';
                    const organiserName = eventResult.rows[0]?.organiser || 'An organiser';
                    const targetEmail = targetUser.rows[0].email;
                    const targetName = targetUser.rows[0].name;
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.londonstudentnetwork.com';
                    const acceptUrl = `${baseUrl}/api/events/cohosts/respond?token=${invitationToken}&action=accept`;
                    const declineUrl = `${baseUrl}/api/events/cohosts/respond?token=${invitationToken}&action=decline`;

                    await sendEventRegistrationEmail({
                        toEmail: targetEmail,
                        subject: `You've been invited to co-host "${eventTitle}" on LSN`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #1e3a5f;">Co-Host Invitation</h2>
                                <p>Hi ${targetName},</p>
                                <p><strong>${organiserName}</strong> has invited you to co-host <strong>"${eventTitle}"</strong> on London Student Network.</p>
                                <p>As a co-host, this event will appear on your account and you'll be listed as an organiser.</p>
                                <div style="margin: 24px 0;">
                                    <a href="${acceptUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 12px;">Accept Invitation</a>
                                    <a href="${declineUrl}" style="background: #6b7280; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Decline</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
                            </div>
                        `,
                        text: `${organiserName} has invited you to co-host "${eventTitle}" on LSN. Accept: ${acceptUrl} | Decline: ${declineUrl}`,
                    });
                } catch (emailError) {
                    console.error("Failed to send co-host invitation email:", emailError);
                }

                return NextResponse.json({ success: true, message: "Co-host invitation sent" });
            }

            case "remove": {
                const { user_id } = body;
                if (!user_id) {
                    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
                }

                // Cannot remove the primary organiser
                const targetCheck = await sql`
                    SELECT role, receives_payments FROM event_cohosts
                    WHERE event_id = ${event_id} AND user_id = ${user_id}
                `;
                if (targetCheck.rows.length === 0) {
                    return NextResponse.json({ error: "Co-host not found" }, { status: 404 });
                }
                if (targetCheck.rows[0].role === 'primary') {
                    return NextResponse.json({ error: "Cannot remove the primary organiser" }, { status: 400 });
                }

                // If removed co-host was payment recipient, transfer to primary
                // Must clear the co-host's flag first to avoid unique index violation
                if (targetCheck.rows[0].receives_payments) {
                    await sql`
                        UPDATE event_cohosts SET receives_payments = FALSE
                        WHERE event_id = ${event_id} AND user_id = ${user_id}
                    `;
                    await sql`
                        UPDATE event_cohosts SET receives_payments = TRUE
                        WHERE event_id = ${event_id} AND role = 'primary'
                    `;
                }

                await sql`
                    DELETE FROM event_cohosts
                    WHERE event_id = ${event_id} AND user_id = ${user_id} AND role != 'primary'
                `;

                return NextResponse.json({ success: true, message: "Co-host removed" });
            }

            case "update": {
                const { user_id, permissions } = body;
                if (!user_id || !permissions) {
                    return NextResponse.json({ error: "user_id and permissions are required" }, { status: 400 });
                }

                // Cannot update primary organiser's permissions
                const targetCheck = await sql`
                    SELECT role FROM event_cohosts WHERE event_id = ${event_id} AND user_id = ${user_id}
                `;
                if (targetCheck.rows.length === 0) {
                    return NextResponse.json({ error: "Co-host not found" }, { status: 404 });
                }
                if (targetCheck.rows[0].role === 'primary') {
                    return NextResponse.json({ error: "Cannot modify primary organiser permissions" }, { status: 400 });
                }

                await sql`
                    UPDATE event_cohosts SET
                        can_edit = COALESCE(${permissions.can_edit ?? null}, can_edit),
                        can_manage_registrations = COALESCE(${permissions.can_manage_registrations ?? null}, can_manage_registrations),
                        can_manage_guests = COALESCE(${permissions.can_manage_guests ?? null}, can_manage_guests),
                        can_view_insights = COALESCE(${permissions.can_view_insights ?? null}, can_view_insights),
                        receives_registration_emails = COALESCE(${permissions.receives_registration_emails ?? null}, receives_registration_emails),
                        receives_summary_emails = COALESCE(${permissions.receives_summary_emails ?? null}, receives_summary_emails)
                    WHERE event_id = ${event_id} AND user_id = ${user_id}
                `;

                return NextResponse.json({ success: true, message: "Co-host permissions updated" });
            }

            case "update-payment-recipient": {
                const { user_id } = body;
                if (!user_id) {
                    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
                }

                // Verify new recipient has Stripe connected
                const stripeCheck = await sql`
                    SELECT stripe_charges_enabled, stripe_payouts_enabled FROM users WHERE id = ${user_id}
                `;
                if (stripeCheck.rows.length === 0 ||
                    !stripeCheck.rows[0].stripe_charges_enabled ||
                    !stripeCheck.rows[0].stripe_payouts_enabled) {
                    return NextResponse.json({
                        error: "Selected co-host doesn't have Stripe payments set up"
                    }, { status: 400 });
                }

                // Clear current payment recipient, set new one
                await sql`UPDATE event_cohosts SET receives_payments = FALSE WHERE event_id = ${event_id}`;
                await sql`
                    UPDATE event_cohosts SET receives_payments = TRUE
                    WHERE event_id = ${event_id} AND user_id = ${user_id}
                `;

                return NextResponse.json({ success: true, message: "Payment recipient updated" });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in co-hosts endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * GET co-hosts for an event.
 * Returns all co-hosts with enriched data (logo, slug, university, Stripe status).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("event_id");

        if (!eventId) {
            return NextResponse.json({ error: "event_id is required" }, { status: 400 });
        }

        const result = await sql`
            SELECT
                ec.user_id, ec.role, ec.status, ec.display_order, ec.is_visible,
                ec.can_edit, ec.can_manage_registrations, ec.can_manage_guests, ec.can_view_insights,
                ec.receives_registration_emails, ec.receives_summary_emails, ec.receives_payments,
                ec.added_at,
                u.name, si.logo_url, si.slug, si.university_affiliation,
                u.stripe_charges_enabled, u.stripe_payouts_enabled
            FROM event_cohosts ec
            JOIN users u ON ec.user_id = u.id
            LEFT JOIN society_information si ON ec.user_id = si.user_id
            WHERE ec.event_id = ${eventId}
            ORDER BY ec.role = 'primary' DESC, ec.display_order ASC
        `;

        return NextResponse.json({ success: true, cohosts: result.rows });
    } catch (error) {
        console.error("Error fetching co-hosts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
