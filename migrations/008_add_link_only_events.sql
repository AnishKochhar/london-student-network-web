-- Migration: Add link-only events feature
-- Created: 2025-10-28
-- Purpose: Allow organizers to create events that are hidden from public listings but accessible via direct link

-- ============================================================================
-- Add link_only column to events table
-- ============================================================================

ALTER TABLE events
ADD COLUMN IF NOT EXISTS link_only BOOLEAN DEFAULT false;

-- Create index for fast filtering of public events in listings
CREATE INDEX IF NOT EXISTS idx_events_link_only
ON events(link_only)
WHERE link_only = false;

-- Add comment for documentation
COMMENT ON COLUMN events.link_only IS 'When true, event is hidden from public listings but accessible via direct URL. Used for invite-only/private events.';

-- ============================================================================
-- Usage Examples
-- ============================================================================

-- Public event (shown in listings):
-- UPDATE events SET link_only = false WHERE id = '...';

-- Link-only event (hidden from listings, accessible via direct link):
-- UPDATE events SET link_only = true WHERE id = '...';

-- Query for public listings (exclude link-only events):
-- SELECT * FROM events WHERE link_only = false AND is_hidden = false;

-- Query for direct access (always allow if event exists):
-- SELECT * FROM events WHERE id = '...';
