import { NextResponse } from 'next/server';
import { verifyApiKey, checkRateLimit, hasScope, logApiKeyUsage } from '../api-key-utils';

/**
 * Middleware to verify API key authentication
 * Use this in API routes that require API key authentication
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await requireApiKey(request, ['events:read']);
 *   if (authResult.error) return authResult.error;
 *
 *   // Continue with authenticated request
 *   const { keyData } = authResult;
 * }
 * ```
 */
export async function requireApiKey(
    request: Request,
    requiredScopes: string[] = []
): Promise<{
    error?: NextResponse;
    keyData?: {
        id: string;
        name: string;
        scopes: string[];
        rateLimit: number;
        createdBy: string;
    };
}> {
    const startTime = Date.now();

    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        return {
            error: NextResponse.json(
                {
                    success: false,
                    error: 'Missing Authorization header',
                    message: 'Please provide an API key in the Authorization header as "Bearer lsn_..."'
                },
                { status: 401 }
            )
        };
    }

    if (!authHeader.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                {
                    success: false,
                    error: 'Invalid Authorization format',
                    message: 'Authorization header must be in format: "Bearer lsn_..."'
                },
                { status: 401 }
            )
        };
    }

    const apiKey = authHeader.substring(7).trim();

    // Verify the API key
    const verification = await verifyApiKey(apiKey);

    if (!verification.valid) {
        // Log failed attempt
        const url = new URL(request.url);
        await logApiKeyUsage({
            apiKeyId: 'unknown',
            endpoint: url.pathname,
            method: request.method,
            statusCode: 401,
            responseTimeMs: Date.now() - startTime,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            errorMessage: verification.error
        });

        return {
            error: NextResponse.json(
                {
                    success: false,
                    error: 'Invalid API key',
                    message: verification.error
                },
                { status: 401 }
            )
        };
    }

    const { keyData } = verification;

    // Check if key has required scopes
    if (requiredScopes.length > 0) {
        const missingScopes = requiredScopes.filter(
            scope => !hasScope(keyData.scopes, scope)
        );

        if (missingScopes.length > 0) {
            return {
                error: NextResponse.json(
                    {
                        success: false,
                        error: 'Insufficient permissions',
                        message: `This API key does not have the required permissions: ${missingScopes.join(', ')}`,
                        requiredScopes,
                        availableScopes: keyData.scopes
                    },
                    { status: 403 }
                )
            };
        }
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(keyData.id, keyData.rateLimit);

    if (!rateLimit.allowed) {
        return {
            error: NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded',
                    message: `You have exceeded the rate limit of ${keyData.rateLimit} requests per hour`,
                    rateLimit: {
                        limit: keyData.rateLimit,
                        current: rateLimit.current,
                        remaining: 0,
                        resetAt: rateLimit.resetAt.toISOString()
                    }
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': keyData.rateLimit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
                        'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
                    }
                }
            )
        };
    }

    // Authentication successful
    return { keyData };
}

/**
 * Helper to create a successful API response with rate limit headers
 */
export function createApiResponse(
    data: unknown,
    rateLimit: {
        limit: number;
        remaining: number;
        resetAt: Date;
    }
): NextResponse {
    return NextResponse.json(data, {
        status: 200,
        headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
        }
    });
}
