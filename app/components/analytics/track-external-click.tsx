"use client";

/**
 * Utility function to track external link clicks
 * Call this when a user clicks on an external registration link
 */
export async function trackExternalClick(eventId: string, clickSource: 'event_page' | 'email' | 'modal' = 'event_page') {
    try {
        await fetch('/api/analytics/track-click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_id: eventId,
                click_source: clickSource,
            }),
        });
    } catch (error) {
        console.error('Click tracking error:', error);
    }
}
