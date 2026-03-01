-- Migration: Add API key management system
-- Created: 2025-11-22
-- Purpose: Enable secure API access for integrations like n8n, Zapier, etc.

-- ============================================================================
-- Create api_keys table
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Key identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash of the API key
    key_prefix VARCHAR(20) NOT NULL,        -- First chars for display (e.g., "lsn_prod_abc...")

    -- Ownership and tracking
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,

    -- Expiration and status
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,

    -- Permissions and limits
    scopes JSONB NOT NULL DEFAULT '["events:read"]'::jsonb,
    rate_limit INTEGER NOT NULL DEFAULT 1000,  -- Requests per hour

    -- Security
    ip_whitelist TEXT[],

    -- Constraints
    CONSTRAINT valid_name CHECK (length(name) >= 3 AND length(name) <= 255),
    CONSTRAINT valid_rate_limit CHECK (rate_limit > 0 AND rate_limit <= 10000)
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX idx_api_keys_active ON api_keys(is_active, expires_at);
CREATE INDEX idx_api_keys_last_used ON api_keys(last_used_at DESC);

-- ============================================================================
-- Create api_key_usage_logs table for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,

    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,

    -- Timing and IP
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,

    -- Metadata
    error_message TEXT,
    request_params JSONB
);

CREATE INDEX idx_api_key_usage_logs_key_id ON api_key_usage_logs(api_key_id, requested_at DESC);
CREATE INDEX idx_api_key_usage_logs_requested_at ON api_key_usage_logs(requested_at DESC);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON TABLE api_keys IS 'Stores API keys for external integrations (n8n, Zapier, etc.)';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key - never store plain text keys';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 12 characters of key for display purposes only';
COMMENT ON COLUMN api_keys.scopes IS 'JSON array of permission scopes, e.g., ["events:read", "registrations:read"]';
COMMENT ON COLUMN api_keys.rate_limit IS 'Maximum number of API requests allowed per hour';
COMMENT ON COLUMN api_keys.ip_whitelist IS 'Optional array of allowed IP addresses for additional security';

COMMENT ON TABLE api_key_usage_logs IS 'Logs all API requests for monitoring and analytics';
