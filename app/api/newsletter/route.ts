import { insertContactForm } from "@/app/lib/data";
import { NextResponse, NextRequest } from "next/server";
import { getClientIP, verifyTurnstile } from "@/app/lib/spam-protection";

// Separate rate limiting for newsletter (simpler, in-memory)
const newsletterRateLimitStore = new Map<string, { count: number; windowStart: number }>();
const NEWSLETTER_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const NEWSLETTER_MAX_SUBMISSIONS = 3; // 3 per hour per IP

function checkNewsletterRateLimit(ip: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const entry = newsletterRateLimitStore.get(ip);

    // Clean up old entries
    if (newsletterRateLimitStore.size > 10000) {
        for (const [key, value] of newsletterRateLimitStore.entries()) {
            if (now - value.windowStart > NEWSLETTER_RATE_LIMIT_WINDOW_MS) {
                newsletterRateLimitStore.delete(key);
            }
        }
    }

    if (!entry || now - entry.windowStart > NEWSLETTER_RATE_LIMIT_WINDOW_MS) {
        newsletterRateLimitStore.set(ip, { count: 1, windowStart: now });
        return { allowed: true };
    }

    if (entry.count >= NEWSLETTER_MAX_SUBMISSIONS) {
        return { allowed: false, reason: "Too many subscription attempts. Please try again later." };
    }

    entry.count++;
    return { allowed: true };
}

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request);

        // Check rate limiting
        const rateLimit = checkNewsletterRateLimit(clientIP);
        if (!rateLimit.allowed) {
            console.log(`[NEWSLETTER-SPAM] Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { message: rateLimit.reason },
                { status: 429 },
            );
        }

        const body = await request.json();
        const { email, turnstileToken } = body;

        // Verify Turnstile
        const turnstileResult = await verifyTurnstile(turnstileToken, clientIP);

        if (!turnstileResult.success && !turnstileResult.fallbackAllowed) {
            console.log(`[NEWSLETTER-SPAM] Turnstile rejected from IP: ${clientIP} - Reason: ${turnstileResult.reason}`);
            return NextResponse.json(
                { message: "Verification failed. Please try again." },
                { status: 400 },
            );
        }

        // If Turnstile is in fallback mode, we still allow (newsletter is lower risk)
        if (!turnstileResult.success && turnstileResult.fallbackAllowed) {
            console.log(`[NEWSLETTER] Turnstile fallback for IP: ${clientIP} - allowing newsletter signup`);
        }

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 },
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email address" },
                { status: 400 },
            );
        }

        // Save to database (using contact_forms table for now)
        const result = await insertContactForm({
            id: "0",
            name: "Newsletter Subscription",
            email: email,
            message: `Newsletter subscription request for email: ${email}`,
        });

        if (result.success) {
            return NextResponse.json(
                { message: "Successfully subscribed to newsletter" },
                { status: 200 },
            );
        } else {
            return NextResponse.json(
                { error: "Failed to subscribe" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error handling newsletter subscription:", error);
        return NextResponse.json(
            { error: "Error processing subscription" },
            { status: 500 },
        );
    }
}
