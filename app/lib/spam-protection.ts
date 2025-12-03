/**
 * Spam Protection Utilities
 *
 * Provides time-based validation and rate limiting for form submissions
 */

import crypto from 'crypto';

const FORM_SECRET = process.env.FORM_SECRET || 'lsn-contact-form-secret-key-2024';

// Minimum time (in seconds) a human would take to fill the form
const MIN_FORM_TIME_SECONDS = 3;

// Rate limiting: max submissions per IP within time window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 5;

// In-memory store for rate limiting (works per serverless instance)
// For production at scale, consider Redis or database-backed solution
interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Creates a signed timestamp token for form timing validation
 * This token is generated when the form loads and verified on submission
 */
export function createFormToken(): string {
    const timestamp = Date.now().toString();
    const signature = crypto
        .createHmac('sha256', FORM_SECRET)
        .update(timestamp)
        .digest('hex')
        .substring(0, 16); // Truncate for shorter token

    // Base64 encode to make it URL-safe
    return Buffer.from(`${timestamp}:${signature}`).toString('base64');
}

/**
 * Verifies the form token and checks if enough time has passed
 * Returns { valid: boolean, reason?: string }
 */
export function verifyFormToken(token: string): { valid: boolean; reason?: string } {
    try {
        // Decode the token
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [timestamp, signature] = decoded.split(':');

        if (!timestamp || !signature) {
            return { valid: false, reason: 'Invalid token format' };
        }

        // Verify the signature
        const expectedSignature = crypto
            .createHmac('sha256', FORM_SECRET)
            .update(timestamp)
            .digest('hex')
            .substring(0, 16);

        if (signature !== expectedSignature) {
            return { valid: false, reason: 'Token signature mismatch' };
        }

        // Check if enough time has passed
        const formLoadTime = parseInt(timestamp, 10);
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - formLoadTime) / 1000;

        if (elapsedSeconds < MIN_FORM_TIME_SECONDS) {
            return {
                valid: false,
                reason: `Form submitted too quickly (${elapsedSeconds.toFixed(1)}s < ${MIN_FORM_TIME_SECONDS}s minimum)`
            };
        }

        // Token is too old (more than 1 hour) - could be replay attack
        const MAX_TOKEN_AGE_MS = 60 * 60 * 1000; // 1 hour
        if (currentTime - formLoadTime > MAX_TOKEN_AGE_MS) {
            return { valid: false, reason: 'Token expired' };
        }

        return { valid: true };
    } catch {
        return { valid: false, reason: 'Token verification failed' };
    }
}

/**
 * Checks rate limiting for an IP address
 * Returns { allowed: boolean, remaining?: number, reason?: string }
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining?: number; reason?: string } {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    // Clean up old entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) {
                rateLimitStore.delete(key);
            }
        }
    }

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        // New window
        rateLimitStore.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: MAX_SUBMISSIONS_PER_WINDOW - 1 };
    }

    if (entry.count >= MAX_SUBMISSIONS_PER_WINDOW) {
        const resetTime = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000 / 60);
        return {
            allowed: false,
            remaining: 0,
            reason: `Rate limit exceeded. Try again in ${resetTime} minutes.`
        };
    }

    entry.count++;
    return { allowed: true, remaining: MAX_SUBMISSIONS_PER_WINDOW - entry.count };
}

/**
 * Gets client IP from request headers (handles proxies like Vercel)
 */
export function getClientIP(request: Request): string {
    // Vercel/Cloudflare headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback
    return 'unknown';
}
