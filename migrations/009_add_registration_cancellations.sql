-- Migration: Add cancellation tracking to event_registrations
-- This allows tracking of cancelled registrations for analytics and organizer visibility

-- Add cancellation tracking columns
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Create index for cancelled registrations queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_cancelled
ON event_registrations(event_id, is_cancelled, cancelled_at);

-- Create index for active registrations (most common query)
CREATE INDEX IF NOT EXISTS idx_event_registrations_active
ON event_registrations(event_id, user_id)
WHERE is_cancelled = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN event_registrations.cancelled_at IS 'Timestamp when the registration was cancelled (NULL if active)';
COMMENT ON COLUMN event_registrations.is_cancelled IS 'Whether this registration has been cancelled (soft delete)';

-- Create a view for active registrations (for backward compatibility)
CREATE OR REPLACE VIEW active_event_registrations AS
SELECT * FROM event_registrations
WHERE is_cancelled = FALSE;

COMMENT ON VIEW active_event_registrations IS 'View of only active (non-cancelled) registrations';
