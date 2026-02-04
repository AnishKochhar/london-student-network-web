import { sql } from "@vercel/postgres";

export interface CapacityCheckResult {
    canRegister: boolean;
    ticketRemaining: number | null;  // null = unlimited
    eventRemaining: number | null;   // null = unlimited
    effectiveRemaining: number | null; // minimum of both
    errorMessage: string | null;
}

/**
 * Centralized capacity check for paid ticket purchases.
 * Checks BOTH ticket-tier AND event-level capacity, excluding cancelled registrations.
 * Returns the MINIMUM of both limits as the effective remaining capacity.
 *
 * @param eventId - The event UUID
 * @param ticketUuid - The ticket tier UUID
 * @param requestedQuantity - Number of tickets being requested (default: 1)
 * @param eventCapacity - Event-level capacity (pass from already-fetched event, null = unlimited)
 */
export async function checkEventCapacity(
    eventId: string,
    ticketUuid: string,
    requestedQuantity: number = 1,
    eventCapacity: number | null
): Promise<CapacityCheckResult> {
    // Single query to get both ticket and event sold counts
    const stats = await sql`
        WITH ticket_stats AS (
            SELECT COALESCE(SUM(quantity), 0)::integer as sold
            FROM event_registrations
            WHERE ticket_uuid = ${ticketUuid}::uuid
            AND (is_cancelled = FALSE OR is_cancelled IS NULL)
        ),
        event_stats AS (
            SELECT COALESCE(SUM(quantity), 0)::integer as sold
            FROM event_registrations
            WHERE event_id = ${eventId}::uuid
            AND (is_cancelled = FALSE OR is_cancelled IS NULL)
        ),
        ticket_capacity AS (
            SELECT tickets_available as capacity
            FROM tickets
            WHERE ticket_uuid = ${ticketUuid}::uuid
        )
        SELECT
            ts.sold as ticket_sold,
            es.sold as event_sold,
            tc.capacity as ticket_capacity
        FROM ticket_stats ts, event_stats es, ticket_capacity tc
    `;

    const row = stats.rows[0];
    const ticketSold = row?.ticket_sold || 0;
    const eventSold = row?.event_sold || 0;
    const ticketCapacity = row?.ticket_capacity;

    // Calculate remaining for each level
    const ticketRemaining = ticketCapacity != null
        ? Math.max(0, ticketCapacity - ticketSold)
        : null;
    const eventRemaining = eventCapacity != null
        ? Math.max(0, eventCapacity - eventSold)
        : null;

    // Effective = minimum of both (treating null as unlimited)
    let effectiveRemaining: number | null = null;
    if (ticketRemaining !== null && eventRemaining !== null) {
        effectiveRemaining = Math.min(ticketRemaining, eventRemaining);
    } else if (ticketRemaining !== null) {
        effectiveRemaining = ticketRemaining;
    } else if (eventRemaining !== null) {
        effectiveRemaining = eventRemaining;
    }

    // Check if registration is allowed
    if (effectiveRemaining !== null && effectiveRemaining < requestedQuantity) {
        const errorMessage = effectiveRemaining <= 0
            ? 'This ticket is sold out'
            : `Only ${effectiveRemaining} ticket(s) remaining`;
        return {
            canRegister: false,
            ticketRemaining,
            eventRemaining,
            effectiveRemaining,
            errorMessage,
        };
    }

    return {
        canRegister: true,
        ticketRemaining,
        eventRemaining,
        effectiveRemaining,
        errorMessage: null,
    };
}

/**
 * Simplified capacity check for free events (no ticket tier).
 * Only checks event-level capacity, excluding cancelled registrations.
 *
 * @param eventId - The event UUID
 * @param eventCapacity - Event-level capacity (null = unlimited)
 */
export async function checkEventCapacitySimple(
    eventId: string,
    eventCapacity: number | null
): Promise<CapacityCheckResult> {
    if (eventCapacity === null || eventCapacity === undefined) {
        return {
            canRegister: true,
            ticketRemaining: null,
            eventRemaining: null,
            effectiveRemaining: null,
            errorMessage: null,
        };
    }

    const result = await sql`
        SELECT COALESCE(SUM(quantity), 0)::integer as sold
        FROM event_registrations
        WHERE event_id = ${eventId}::uuid
        AND (is_cancelled = FALSE OR is_cancelled IS NULL)
    `;

    const eventSold = result.rows[0]?.sold || 0;
    const eventRemaining = Math.max(0, eventCapacity - eventSold);

    if (eventRemaining <= 0) {
        return {
            canRegister: false,
            ticketRemaining: null,
            eventRemaining: 0,
            effectiveRemaining: 0,
            errorMessage: 'This event is at full capacity',
        };
    }

    return {
        canRegister: true,
        ticketRemaining: null,
        eventRemaining,
        effectiveRemaining: eventRemaining,
        errorMessage: null,
    };
}

/**
 * Get event sold count (excluding cancelled registrations).
 * Useful for display purposes.
 */
export async function getEventSoldCount(eventId: string): Promise<number> {
    const result = await sql`
        SELECT COALESCE(SUM(quantity), 0)::integer as sold
        FROM event_registrations
        WHERE event_id = ${eventId}::uuid
        AND (is_cancelled = FALSE OR is_cancelled IS NULL)
    `;
    return result.rows[0]?.sold || 0;
}
