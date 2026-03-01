import crypto from 'crypto';
import { sql } from '@vercel/postgres';

/**
 * Generate a secure API key with the format: lsn_[env]_[random]
 * @param environment - 'prod' or 'test'
 * @returns Generated API key
 */
export function generateApiKey(environment: 'prod' | 'test' = 'prod'): string {
    // Generate 32 random bytes for high entropy
    const randomBytes = crypto.randomBytes(32);
    // Convert to URL-safe base64 (no padding, URL-safe characters)
    const randomString = randomBytes.toString('base64url').substring(0, 32);

    return `lsn_${environment}_${randomString}`;
}

/**
 * Hash an API key using SHA-256 for secure storage
 * Never store plain text API keys in the database
 * @param apiKey - The plain text API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(apiKey: string): string {
    return crypto
        .createHash('sha256')
        .update(apiKey)
        .digest('hex');
}

/**
 * Get a display-friendly prefix of an API key
 * Shows only the first 12 characters for security
 * @param apiKey - The full API key
 * @returns Display prefix (e.g., "lsn_prod_abc...")
 */
export function getKeyPrefix(apiKey: string): string {
    if (apiKey.length < 12) return apiKey;
    return apiKey.substring(0, 12) + '...';
}

/**
 * Validate API key format
 * @param apiKey - Key to validate
 * @returns true if valid format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
    // Must start with lsn_prod_ or lsn_test_ and be at least 45 characters
    const pattern = /^lsn_(prod|test)_[A-Za-z0-9_-]{32,}$/;
    return pattern.test(apiKey);
}

/**
 * Verify an API key against the database
 * @param apiKey - The API key to verify
 * @returns Verification result with key data if valid
 */
export async function verifyApiKey(apiKey: string): Promise<{
    valid: boolean;
    error?: string;
    keyData?: {
        id: string;
        name: string;
        scopes: string[];
        rateLimit: number;
        createdBy: string;
    };
}> {
    try {
        // Validate format first
        if (!isValidApiKeyFormat(apiKey)) {
            return { valid: false, error: 'Invalid API key format' };
        }

        // Hash the key for database lookup
        const keyHash = hashApiKey(apiKey);

        // Query the database
        const result = await sql`
            SELECT
                id,
                name,
                scopes,
                rate_limit,
                created_by,
                expires_at,
                is_active
            FROM api_keys
            WHERE key_hash = ${keyHash}
        `;

        if (result.rows.length === 0) {
            return { valid: false, error: 'API key not found' };
        }

        const key = result.rows[0];

        // Check if key is active
        if (!key.is_active) {
            return { valid: false, error: 'API key has been revoked' };
        }

        // Check if key has expired
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
            return { valid: false, error: 'API key has expired' };
        }

        // Update last_used_at timestamp asynchronously (don't await)
        sql`
            UPDATE api_keys
            SET last_used_at = NOW()
            WHERE id = ${key.id}
        `.catch(err => console.error('Failed to update last_used_at:', err));

        return {
            valid: true,
            keyData: {
                id: key.id,
                name: key.name,
                scopes: key.scopes || ['events:read'],
                rateLimit: key.rate_limit,
                createdBy: key.created_by
            }
        };
    } catch (error) {
        console.error('Error verifying API key:', error);
        return { valid: false, error: 'Internal server error' };
    }
}

/**
 * Check if an API key has a specific scope/permission
 * @param scopes - Array of scopes the key has
 * @param requiredScope - The scope to check for
 * @returns true if key has the required scope
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
    return scopes.includes(requiredScope) || scopes.includes('*');
}

/**
 * Log API key usage for analytics and monitoring
 * @param params - Usage log parameters
 */
export async function logApiKeyUsage(params: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode?: number;
    responseTimeMs?: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
    requestParams?: Record<string, unknown>;
}): Promise<void> {
    try {
        await sql`
            INSERT INTO api_key_usage_logs (
                api_key_id,
                endpoint,
                method,
                status_code,
                response_time_ms,
                ip_address,
                user_agent,
                error_message,
                request_params
            ) VALUES (
                ${params.apiKeyId},
                ${params.endpoint},
                ${params.method},
                ${params.statusCode || null},
                ${params.responseTimeMs || null},
                ${params.ipAddress || null},
                ${params.userAgent || null},
                ${params.errorMessage || null},
                ${params.requestParams ? JSON.stringify(params.requestParams) : null}
            )
        `;
    } catch (error) {
        // Don't fail the request if logging fails
        console.error('Failed to log API key usage:', error);
    }
}

/**
 * Check rate limit for an API key
 * Uses Redis for fast in-memory rate limiting
 * @param apiKeyId - The API key ID
 * @param rateLimit - Maximum requests per hour
 * @returns Rate limit status
 */
export async function checkRateLimit(
    apiKeyId: string,
    rateLimit: number
): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    current: number;
}> {
    try {
        const getRedisClient = (await import('@/app/lib/config/private/redis')).default;
        const redis = await getRedisClient();

        // Create hourly bucket key
        const now = Date.now();
        const hourBucket = Math.floor(now / 3600000); // Hour in ms
        const key = `rate_limit:${apiKeyId}:${hourBucket}`;

        // Increment counter
        const current = await redis.incr(key);

        // Set expiration on first request in this hour
        if (current === 1) {
            await redis.expire(key, 3600); // Expire after 1 hour
        }

        const resetAt = new Date((hourBucket + 1) * 3600000);
        const remaining = Math.max(0, rateLimit - current);

        return {
            allowed: current <= rateLimit,
            remaining,
            resetAt,
            current
        };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // On error, allow the request but log it
        return {
            allowed: true,
            remaining: rateLimit,
            resetAt: new Date(Date.now() + 3600000),
            current: 0
        };
    }
}
