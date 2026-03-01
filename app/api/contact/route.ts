import { insertContactForm } from "@/app/lib/data";
import { NextResponse, NextRequest } from "next/server";
import sendSendGridEmail from "@/app/lib/config/private/sendgrid";
import ContactFormEmail from "@/app/components/templates/contact-form-email";
import ContactFormEmailFallback from "@/app/components/templates/contact-form-email-fallback";
import { verifyFormToken, checkRateLimit, getClientIP, verifyTurnstile } from "@/app/lib/spam-protection";

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request);

        // Check rate limiting first (5 per hour for contact form)
        const rateLimit = checkRateLimit(clientIP);
        if (!rateLimit.allowed) {
            console.log(`[CONTACT-SPAM] Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { message: rateLimit.reason || "Too many requests. Please try again later." },
                { status: 429 },
            );
        }

        const body = await request.json();
        const { name, email, message, inquiryPurpose, description, organisation, formToken, turnstileToken } = body;

        // Verify Turnstile (primary protection)
        const turnstileResult = await verifyTurnstile(turnstileToken, clientIP);

        if (!turnstileResult.success) {
            if (!turnstileResult.fallbackAllowed) {
                // Turnstile explicitly rejected (likely a bot)
                console.log(`[CONTACT-SPAM] Turnstile rejected from IP: ${clientIP} - Reason: ${turnstileResult.reason}`);
                return NextResponse.json(
                    { message: "Verification failed. Please try again." },
                    { status: 400 },
                );
            }

            // Fallback mode: use time-based validation
            console.log(`[CONTACT-SPAM] Turnstile fallback for IP: ${clientIP} - Reason: ${turnstileResult.reason}`);

            if (!formToken) {
                console.log(`[CONTACT-SPAM] Missing form token from IP: ${clientIP}`);
                return NextResponse.json(
                    { message: "Invalid form submission. Please refresh the page and try again." },
                    { status: 400 },
                );
            }

            const tokenCheck = verifyFormToken(formToken);
            if (!tokenCheck.valid) {
                console.log(`[CONTACT-SPAM] Invalid token from IP: ${clientIP} - Reason: ${tokenCheck.reason}`);
                return NextResponse.json(
                    { message: "Form submission rejected. Please wait a moment and try again." },
                    { status: 400 },
                );
            }
        }

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

        // Save to database
        const result = await insertContactForm({
            id: "0",
            name,
            email,
            message: fullMessage,
        });

        if (result.success) {
            // Send email notification to LSN team
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
                    replyTo: email,
                };

                await sendSendGridEmail(emailMsg);

                return NextResponse.json(
                    { message: "Form submitted successfully" },
                    { status: 200 },
                );
            } catch (emailError) {
                console.error("Error sending email notification:", emailError);
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
        console.error("Error handling contact form submission:", error);
        return NextResponse.json(
            { error: "Error processing form" },
            { status: 500 },
        );
    }
}
