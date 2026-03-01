-- Migration: 013_add_featured_events.sql
-- Description: Add featured events configuration table for homepage display
-- Date: 2026-01-29

-- Featured events configuration table
-- Stores which event is currently featured on the homepage with optional customizations
CREATE TABLE IF NOT EXISTS featured_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Custom display overrides
    custom_description TEXT,                 -- Marketing copy for homepage (optional override)

    -- Scheduling
    featured_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    featured_end TIMESTAMPTZ,               -- NULL = until event ends

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one event can be featured at a time (enforced at application level)
    CONSTRAINT unique_featured_event UNIQUE (event_id)
);

-- Index for efficient lookup of current active featured event
CREATE INDEX IF NOT EXISTS idx_featured_events_active_schedule
ON featured_events(is_active, featured_start, featured_end)
WHERE is_active = TRUE;

-- Comment on table
COMMENT ON TABLE featured_events IS 'Configuration for featured events displayed prominently on the homepage';
COMMENT ON COLUMN featured_events.custom_description IS 'Optional marketing copy that overrides the event description on the homepage';
COMMENT ON COLUMN featured_events.featured_start IS 'When this event should start being featured';
COMMENT ON COLUMN featured_events.featured_end IS 'When this event should stop being featured (NULL = until event ends)';
