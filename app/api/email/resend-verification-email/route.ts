import { sendEmailVerificationEmail } from "@/app/lib/send-email";
import { NextResponse, NextRequest } from "next/server";
import { insertToken } from "@/app/lib/redis-operations";
import { generateToken } from "@/app/lib/utils";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            console.error("Missing email in request body");
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 },
            );
        }

        const token = generateToken();

        const response = await insertToken(email, token, "verify");

        if (!response.success) {
            console.log("Failed to insert token into redis");
            throw new Error("Failed to insert token into redis");
        }

        await sendEmailVerificationEmail(email, token);

        return NextResponse.json(
            { success: true, message: "Email sent successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error("[POST] Error while sending email:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send email" },
            { status: 500 },
        );
    }
}
