-- Migration: 014_add_event_cohosts.sql
-- Description: Add event co-hosting support - junction table for many-to-many events<->organisers
-- Date: 2026-02-28

-- Event co-hosts table
-- Maps events to their organisers (primary creator + co-hosts)
-- The primary organiser from events.organiser_uid is also stored here for query consistency
CREATE TABLE IF NOT EXISTS event_cohosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core relationship
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role: 'primary' = the original creator, 'cohost' = invited co-host
    role VARCHAR(20) NOT NULL DEFAULT 'cohost',

    -- Invitation status: pending (awaiting response), accepted, declined
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    invitation_token VARCHAR(64),

    -- Display
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,

    -- Permissions (configurable by primary organiser)
    can_edit BOOLEAN DEFAULT FALSE,
    can_manage_registrations BOOLEAN DEFAULT TRUE,
    can_manage_guests BOOLEAN DEFAULT TRUE,
    can_view_insights BOOLEAN DEFAULT TRUE,

    -- Notification preferences
    receives_registration_emails BOOLEAN DEFAULT TRUE,
    receives_summary_emails BOOLEAN DEFAULT TRUE,

    -- Payment routing (only ONE co-host per event receives payments)
    receives_payments BOOLEAN DEFAULT FALSE,

    -- Metadata
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,

    -- Each user can only appear once per event
    CONSTRAINT unique_event_cohost UNIQUE (event_id, user_id)
);

-- Lookup all events a user co-hosts (for account page)
CREATE INDEX IF NOT EXISTS idx_event_cohosts_user ON event_cohosts(user_id);

-- Lookup all co-hosts of an event
CREATE INDEX IF NOT EXISTS idx_event_cohosts_event ON event_cohosts(event_id);

-- Lookup by invitation token (for accept/decline links)
CREATE INDEX IF NOT EXISTS idx_event_cohosts_token
ON event_cohosts(invitation_token) WHERE invitation_token IS NOT NULL;

-- Exactly one 'primary' role per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_cohosts_primary
ON event_cohosts(event_id) WHERE role = 'primary';

-- Exactly one payment receiver per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_cohosts_payment
ON event_cohosts(event_id) WHERE receives_payments = TRUE;

-- Backfill: insert the primary organiser for every existing event
-- This ensures the new table is the source of truth from day one
INSERT INTO event_cohosts (
    event_id, user_id, role, status, display_order, is_visible,
    can_edit, can_manage_registrations, can_manage_guests, can_view_insights,
    receives_registration_emails, receives_summary_emails, receives_payments, accepted_at
)
SELECT
    e.id, e.organiser_uid, 'primary', 'accepted', 0, TRUE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE, NOW()
FROM events e
WHERE e.organiser_uid IS NOT NULL
AND (e.is_deleted IS NULL OR e.is_deleted = false)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Documentation
COMMENT ON TABLE event_cohosts IS 'Junction table mapping events to their organisers (primary + co-hosts). events.organiser_uid is preserved for backward compatibility but this table is the source of truth for multi-organiser features.';
COMMENT ON COLUMN event_cohosts.role IS 'primary = original event creator, cohost = invited co-host';
COMMENT ON COLUMN event_cohosts.status IS 'pending = awaiting co-host response, accepted = confirmed, declined = rejected invitation';
COMMENT ON COLUMN event_cohosts.invitation_token IS 'Unique token used in email accept/decline links';
COMMENT ON COLUMN event_cohosts.receives_payments IS 'Only one co-host per event can receive ticket payments (enforced by partial unique index)';
