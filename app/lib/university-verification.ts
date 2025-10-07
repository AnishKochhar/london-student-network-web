"use server";

import { sql } from "@vercel/postgres";
import { redis } from "./config";
import crypto from "crypto";

/**
 * Extract university code from .ac.uk email domain
 * @param email - University email address
 * @returns University code or null if invalid
 */
export async function extractUniversityFromEmail(
    email: string,
): Promise<{ success: boolean; universityCode?: string; universityName?: string; error?: string }> {
    try {
        // Extract domain from email
        const emailLower = email.toLowerCase().trim();
        const domain = emailLower.split("@")[1];

        if (!domain) {
            return { success: false, error: "Invalid email format" };
        }

        // Check if it's a .ac.uk domain
        if (!domain.endsWith(".ac.uk")) {
            return { success: false, error: "Email must be a .ac.uk university email" };
        }

        // Look up university in database
        const result = await sql`
            SELECT university_code, university_name
            FROM university_email_domains
            WHERE email_domain = ${domain} AND is_active = true
        `;

        if (result.rows.length === 0) {
            return {
                success: false,
                error: `University domain ${domain} not recognized. Please contact support if you believe this is an error.`
            };
        }

        return {
            success: true,
            universityCode: result.rows[0].university_code,
            universityName: result.rows[0].university_name,
        };
    } catch (error) {
        console.error("Error extracting university from email:", error);
        return { success: false, error: "Failed to validate university email" };
    }
}

/**
 * Generate a secure verification token
 */
export async function generateVerificationToken(): Promise<string> {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Store university email verification token in Redis
 */
export async function storeUniversityVerificationToken(
    userId: string,
    universityEmail: string,
    token: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const tokenKey = `university_verification_token:${token}`;
        const userKey = `university_verification_user:${userId}`;

        // Store token data with 1 hour expiry
        const expiryInSeconds = 3600; // 1 hour

        const pipeline = redis.pipeline();
        pipeline.set(
            tokenKey,
            JSON.stringify({ userId, universityEmail }),
            "EX",
            expiryInSeconds,
        );
        pipeline.set(userKey, token, "EX", expiryInSeconds);

        const results = await pipeline.exec();

        if (
            results &&
            results.length === 2 &&
            results[0][0] === null &&
            results[1][0] === null
        ) {
            console.log(
                `University verification token for user ${userId} stored successfully`,
            );
            return { success: true };
        } else {
            console.error("Failed to store university verification token:", results);
            return { success: false, error: "Failed to store verification token" };
        }
    } catch (error) {
        console.error("Error storing university verification token:", error);
        return { success: false, error: "Failed to store verification token" };
    }
}

/**
 * Validate university verification token
 */
export async function validateUniversityVerificationToken(
    token: string,
): Promise<{
    success: boolean;
    userId?: string;
    universityEmail?: string;
    error?: string
}> {
    try {
        const tokenKey = `university_verification_token:${token}`;
        const data = await redis.get(tokenKey);

        if (!data) {
            return { success: false, error: "Invalid or expired token" };
        }

        const { userId, universityEmail } = JSON.parse(data as string);
        return { success: true, userId, universityEmail };
    } catch (error) {
        console.error("Error validating university verification token:", error);
        return { success: false, error: "Failed to validate token" };
    }
}

/**
 * Mark university email as verified in database
 */
export async function verifyUniversityEmail(
    userId: string,
    universityEmail: string,
    token: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        // Extract university code from email
        const universityResult = await extractUniversityFromEmail(universityEmail);

        if (!universityResult.success || !universityResult.universityCode) {
            return { success: false, error: universityResult.error };
        }

        // Update user's university email verification in database
        await sql`
            UPDATE users
            SET
                university_email = ${universityEmail},
                university_email_verified = true,
                verified_university = ${universityResult.universityCode}
            WHERE id = ${userId}
        `;

        // Remove the Redis token entry
        const tokenKey = `university_verification_token:${token}`;
        const userKey = `university_verification_user:${userId}`;
        await redis.del(tokenKey);
        await redis.del(userKey);

        console.log(
            `University email verified for user ${userId}: ${universityEmail} (${universityResult.universityCode})`,
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error verifying university email:", error);

        // Handle unique constraint violation (university email already used)
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
            return {
                success: false,
                error: "This university email has already been verified by another account"
            };
        }

        return { success: false, error: "Failed to verify university email" };
    }
}

/**
 * Check if user has already verified a university email
 */
export async function hasVerifiedUniversityEmail(
    userId: string,
): Promise<{ verified: boolean; universityEmail?: string; universityCode?: string }> {
    try {
        const result = await sql`
            SELECT university_email, university_email_verified, verified_university
            FROM users
            WHERE id = ${userId}
        `;

        if (result.rows.length === 0) {
            return { verified: false };
        }

        const user = result.rows[0];
        if (user.university_email_verified && user.university_email) {
            return {
                verified: true,
                universityEmail: user.university_email,
                universityCode: user.verified_university,
            };
        }

        return { verified: false };
    } catch (error) {
        console.error("Error checking university email verification:", error);
        return { verified: false };
    }
}

/**
 * Get all supported university domains
 */
export async function getSupportedUniversities(): Promise<{
    success: boolean;
    universities?: Array<{
        code: string;
        name: string;
        domain: string;
    }>;
    error?: string;
}> {
    try {
        const result = await sql`
            SELECT university_code as code, university_name as name, email_domain as domain
            FROM university_email_domains
            WHERE is_active = true
            ORDER BY university_name
        `;

        return {
            success: true,
            universities: result.rows.map((row) => ({
                code: row.code,
                name: row.name,
                domain: row.domain,
            })),
        };
    } catch (error) {
        console.error("Error fetching supported universities:", error);
        return { success: false, error: "Failed to fetch universities" };
    }
}
