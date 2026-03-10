-- Migration 016: Event Invitations
-- Enables organisers to invite past attendees to upcoming events
-- with background processing and delivery tracking.

CREATE TABLE IF NOT EXISTS event_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL,
    sent_by UUID NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_user_id UUID,
    source_event_id UUID,          -- which past event the contact came from
    custom_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | queued | sent | delivered | opened | clicked | bounced | dropped
    sendgrid_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,

    CONSTRAINT uq_event_invitation_recipient UNIQUE (event_id, recipient_email)
);

-- Primary lookup: all invitations for an event
CREATE INDEX idx_event_invitations_event_id ON event_invitations(event_id);

-- Lookup: all invitations sent by a user
CREATE INDEX idx_event_invitations_sent_by ON event_invitations(sent_by);

-- Polling: find pending invitations for background processing
CREATE INDEX idx_event_invitations_status ON event_invitations(event_id, status)
    WHERE status IN ('pending', 'queued');

-- Tracking: match SendGrid webhooks to invitations
CREATE INDEX idx_event_invitations_sendgrid ON event_invitations(sendgrid_message_id)
    WHERE sendgrid_message_id IS NOT NULL;
