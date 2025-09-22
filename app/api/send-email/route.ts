import { insertContactForm } from "@/app/lib/data";
import { ContactFormInput } from "@/app/lib/types";
import { NextResponse, NextRequest } from "next/server";
import sendSendGridEmail from "@/app/lib/config/private/sendgrid";
import ContactFormEmail from "@/app/components/templates/contact-form-email";
import ContactFormEmailFallback from "@/app/components/templates/contact-form-email-fallback";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, message, inquiryPurpose, description, organisation } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 },
            );
        }

        // Format the full message for database storage
        const fullMessage = `
Inquiry Purpose: ${inquiryPurpose || "Not specified"}
Description: ${description || "Not specified"}
${organisation ? `Organisation: ${organisation}` : ""}

Message: ${message}
        `.trim();

        // First, save to database
        const result = await insertContactForm({
            id: "0",
            name,
            email,
            message: fullMessage,
        });

        if (result.success) {
            // Then send email notification to LSN team
            try {
                const htmlContent = ContactFormEmail({
                    name,
                    email,
                    message,
                    inquiryPurpose: inquiryPurpose || "Not specified",
                    description: description || "Not specified",
                    organisation: organisation || ""
                });
                const textContent = ContactFormEmailFallback({
                    name,
                    email,
                    message,
                    inquiryPurpose: inquiryPurpose || "Not specified",
                    description: description || "Not specified",
                    organisation: organisation || ""
                });

                const emailMsg = {
                    to: "hello@londonstudentnetwork.com",
                    from: "hello@londonstudentnetwork.com",
                    subject: `New Contact Form Submission from ${name}`,
                    html: htmlContent,
                    text: textContent,
                    replyTo: email, // Set reply-to as the sender's email
                };

                await sendSendGridEmail(emailMsg);

                return NextResponse.json(
                    { message: "Form submitted successfully" },
                    { status: 200 },
                );
            } catch (emailError) {
                console.error("Error sending email notification:", emailError);
                // Still return success as the form was saved to database
                return NextResponse.json(
                    { message: "Form submitted successfully (email notification may have failed)" },
                    { status: 200 },
                );
            }
        } else {
            return NextResponse.json(
                { error: "Failed to submit form" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error handling form submission:", error);
        return NextResponse.json(
            { error: "Error processing form" },
            { status: 500 },
        );
    }
}
