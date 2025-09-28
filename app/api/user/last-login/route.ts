import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { sql } from "@vercel/postgres";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";

export async function GET(req: Request) {
	try {
		// Rate limiting
		const identifier = getRateLimitIdentifier(req);
		const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

		if (!rateLimitResult.success) {
			return createRateLimitResponse(rateLimitResult.resetTime);
		}

		// Authentication required
		const user = await requireAuth();

		// Get user's last login information
		const result = await sql`
            SELECT last_login, created_at
            FROM users
            WHERE id = ${user.id}
        `;

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		const userData = result.rows[0];

		return NextResponse.json({
			success: true,
			data: {
				lastLogin: userData.last_login,
				accountCreated: userData.created_at
			}
		});

	} catch (error) {
		console.error("Error fetching user login info:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch login information" },
			{ status: 500 }
		);
	}
}