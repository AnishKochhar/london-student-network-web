import { sendOrganiserEmail } from "@/app/lib/send-email";
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // Rate limiting for email sending (stricter limits)
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.email);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        // Authentication required
        await requireAuth();

        const { id, email, subject, text } = await req.json();

        // Validate fields
        if (!id || !subject || !text) {
            console.warn("[POST] Validation failed: Missing email fields");
            return NextResponse.json({ error: "Missing email fields" });
        }

        if (!email) {
            console.error(
                "Error with the server, could not extract user email",
            );
            return NextResponse.json({ error: "Failed to extract user email" });
        }

        await sendOrganiserEmail({ id, email, subject, text });

        return NextResponse.json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("[POST] Error while sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 },
        );
    }
}
