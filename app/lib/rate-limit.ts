// Simple in-memory rate limiting (for production, use Redis)
interface RateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

interface RateLimitRecord {
	count: number;
	resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const rateLimitConfigs = {
	auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
	email: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 emails per minute
	registration: { windowMs: 60 * 1000, maxRequests: 3 }, // 3 registrations per minute
	general: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
} as const;

export function rateLimit(
	identifier: string,
	config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const key = `${identifier}:${config.windowMs}:${config.maxRequests}`;

	// Clean up expired entries periodically
	if (Math.random() < 0.01) { // 1% chance to cleanup
		cleanupExpiredEntries();
	}

	let record = rateLimitStore.get(key);

	if (!record || now > record.resetTime) {
		// Create new window
		record = {
			count: 1,
			resetTime: now + config.windowMs
		};
		rateLimitStore.set(key, record);
		return {
			success: true,
			remaining: config.maxRequests - 1,
			resetTime: record.resetTime
		};
	}

	if (record.count >= config.maxRequests) {
		return {
			success: false,
			remaining: 0,
			resetTime: record.resetTime
		};
	}

	record.count++;
	rateLimitStore.set(key, record);

	return {
		success: true,
		remaining: config.maxRequests - record.count,
		resetTime: record.resetTime
	};
}

function cleanupExpiredEntries() {
	const now = Date.now();
	for (const [key, record] of rateLimitStore.entries()) {
		if (now > record.resetTime) {
			rateLimitStore.delete(key);
		}
	}
}

export function getRateLimitIdentifier(request: Request): string {
	// In production, use IP address
	const forwarded = request.headers.get('x-forwarded-for');
	const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
	return ip;
}

export function createRateLimitResponse(resetTime: number) {
	const resetDate = new Date(resetTime);
	return Response.json(
		{
			success: false,
			error: "Too many requests. Please try again later.",
			retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
		},
		{
			status: 429,
			headers: {
				'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
				'X-RateLimit-Reset': resetDate.toISOString()
			}
		}
	);
}