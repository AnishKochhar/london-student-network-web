import { sendUserEmail } from "@/app/lib/send-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { toEmail, fromEmail, subject, text } = await req.json();

        // Validate fields
        if (!toEmail || !fromEmail || !subject || !text) {
            console.warn("[POST] Validation failed: Missing email fields");
            return NextResponse.json({ error: "Missing email fields" });
        }

        if (!toEmail) {
            console.error(
                "Error with the server, could not extract user email",
            );
            return NextResponse.json({ error: "Failed to extract user email" });
        }

        await sendUserEmail({ toEmail, fromEmail, subject, text });

        return NextResponse.json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("[POST] Error while sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 },
        );
    }
}
