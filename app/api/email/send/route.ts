import { sendOrganiserEmail } from "@/app/lib/send-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
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
