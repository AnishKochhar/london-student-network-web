import { NextRequest, NextResponse } from "next/server";
import sendSendGridEmail from "@/app/lib/config/private/sendgrid";

interface FeedbackData {
    name: string;
    email?: string;
    message: string;
}

export async function POST(request: NextRequest) {
    try {

        const body: FeedbackData = await request.json();
        const { name, email, message } = body;

        // Validate required fields
        if (!name || !message) {
            return NextResponse.json(
                { success: false, message: "Name and message are required" },
                { status: 400 }
            );
        }

        // Validate email format if provided
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (email && !emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: "Invalid email format" },
                { status: 400 }
            );
        }

        // Prepare email content
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #064580; border-bottom: 2px solid #064580; padding-bottom: 10px;">
                    New Feedback from London Student Network
                </h2>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Contact Information</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    ${email ? `<p><strong>Email:</strong> ${email}</p>` : '<p><em>No email provided</em></p>'}
                </div>

                <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h3 style="color: #333; margin-top: 0;">Message</h3>
                    <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; font-size: 12px; color: #666;">
                    <p style="margin: 0;">This feedback was submitted through the London Student Network website help button.</p>
                    <p style="margin: 5px 0 0 0;">Submitted at: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
                </div>
            </div>
        `;

        const emailText = `
New Feedback from London Student Network

Contact Information:
Name: ${name}
${email ? `Email: ${email}` : 'No email provided'}

Message:
${message}

Submitted at: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        `;

        // Send email using the centralized email utility with built-in fallback
        const msg = {
            to: "hello@londonstudentnetwork.com",
            from: "hello@londonstudentnetwork.com",
            subject: `LSN Feedback from ${name}`,
            text: emailText,
            html: emailHtml,
        };

        await sendSendGridEmail(msg);

        return NextResponse.json({
            success: true,
            message: "Feedback sent successfully"
        });

    } catch (error) {
        console.error("Error sending feedback email:", error);

        return NextResponse.json(
            { success: false, message: "Failed to send feedback. Please try again later." },
            { status: 500 }
        );
    }
}