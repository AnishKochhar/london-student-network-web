-- Migration: Create event_faqs table
-- Description: Adds FAQ functionality to events
-- Created: 2025-11-16

-- Create the event_faqs table
CREATE TABLE IF NOT EXISTS event_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_uuid UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    question TEXT NOT NULL CHECK (char_length(question) BETWEEN 1 AND 500),
    answer TEXT NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 2000),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_faqs_event_uuid ON event_faqs(event_uuid);
CREATE INDEX IF NOT EXISTS idx_event_faqs_order ON event_faqs(event_uuid, order_index);

-- Add comment to table
COMMENT ON TABLE event_faqs IS 'Stores frequently asked questions for events';
COMMENT ON COLUMN event_faqs.event_uuid IS 'Foreign key reference to the events table';
COMMENT ON COLUMN event_faqs.question IS 'FAQ question text (max 500 characters)';
COMMENT ON COLUMN event_faqs.answer IS 'FAQ answer text with markdown support (max 2000 characters)';
COMMENT ON COLUMN event_faqs.order_index IS 'Display order for FAQs (lower numbers appear first)';
