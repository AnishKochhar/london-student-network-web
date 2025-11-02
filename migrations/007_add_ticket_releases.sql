-- Migration: Add Ticket Release Feature
-- Created: 2025-10-24
-- Purpose: Enable time-based ticket releases (Early Bird, General Sale, etc.)

-- ============================================================================
-- Add Release Fields to Tickets Table
-- ============================================================================

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS release_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS release_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS release_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS release_order INTEGER DEFAULT 1;

-- Add index for efficient release queries
CREATE INDEX IF NOT EXISTS idx_tickets_release_times
ON tickets(event_uuid, release_start_time, release_end_time)
WHERE release_start_time IS NOT NULL;

-- Add index for release ordering
CREATE INDEX IF NOT EXISTS idx_tickets_release_order
ON tickets(event_uuid, release_order);

-- Add comments
COMMENT ON COLUMN tickets.release_name IS 'Display name for this release (e.g., "Early Bird", "1st Release", "General Admission")';
COMMENT ON COLUMN tickets.release_start_time IS 'When this ticket becomes available for purchase (NULL = available immediately)';
COMMENT ON COLUMN tickets.release_end_time IS 'When this ticket stops being available (NULL = available until sold out or event ends)';
COMMENT ON COLUMN tickets.release_order IS 'Display order for releases (1, 2, 3...) - lower numbers appear first';

-- ============================================================================
-- Helper Function: Get Available Tickets for an Event
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_tickets_for_event(p_event_uuid UUID)
RETURNS TABLE (
    ticket_uuid UUID,
    ticket_name VARCHAR,
    ticket_price TEXT,
    tickets_available INTEGER,
    price_id VARCHAR,
    release_name VARCHAR,
    release_start_time TIMESTAMPTZ,
    release_end_time TIMESTAMPTZ,
    release_order INTEGER,
    is_available BOOLEAN,
    availability_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.ticket_uuid,
        t.ticket_name,
        t.ticket_price,
        t.tickets_available,
        t.price_id,
        t.release_name,
        t.release_start_time,
        t.release_end_time,
        t.release_order,
        -- Determine if ticket is currently available
        CASE
            WHEN t.tickets_available IS NOT NULL AND t.tickets_available <= 0 THEN false
            WHEN t.release_start_time IS NOT NULL AND t.release_start_time > NOW() THEN false
            WHEN t.release_end_time IS NOT NULL AND t.release_end_time < NOW() THEN false
            ELSE true
        END as is_available,
        -- Determine availability status
        CASE
            WHEN t.tickets_available IS NOT NULL AND t.tickets_available <= 0 THEN 'sold_out'
            WHEN t.release_start_time IS NOT NULL AND t.release_start_time > NOW() THEN 'upcoming'
            WHEN t.release_end_time IS NOT NULL AND t.release_end_time < NOW() THEN 'ended'
            ELSE 'available'
        END as availability_status
    FROM tickets t
    WHERE t.event_uuid = p_event_uuid
    ORDER BY t.release_order ASC, t.ticket_price::numeric ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION get_available_tickets_for_event IS 'Returns all tickets for an event with availability status based on release times and capacity';

-- ============================================================================
-- Sample Data (for reference - do not execute in production)
-- ============================================================================

-- Example 1: Event with timed releases
-- INSERT INTO tickets (event_uuid, ticket_name, ticket_price, tickets_available, release_name, release_start_time, release_end_time, release_order)
-- VALUES
--     ('event-uuid-here', 'Super Early Bird', '5.00', 50, '1st Release', NOW(), NOW() + INTERVAL '7 days', 1),
--     ('event-uuid-here', 'Early Bird', '10.00', 100, '2nd Release', NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days', 2),
--     ('event-uuid-here', 'General Admission', '15.00', 200, '3rd Release', NOW() + INTERVAL '14 days', NULL, 3);

-- Example 2: Event with Luma-style releases
-- INSERT INTO tickets (event_uuid, ticket_name, ticket_price, tickets_available, release_name, release_start_time, release_end_time, release_order)
-- VALUES
--     ('event-uuid-here', '1st Release', '14.99', 50, NULL, NOW(), NOW() + INTERVAL '3 days', 1),
--     ('event-uuid-here', '2nd Release', '24.99', 100, NULL, NOW() + INTERVAL '3 days', NOW() + INTERVAL '7 days', 2),
--     ('event-uuid-here', '3rd Release', '34.99', 150, NULL, NOW() + INTERVAL '7 days', NULL, 3);

-- ============================================================================
-- Migration Complete
-- ============================================================================
