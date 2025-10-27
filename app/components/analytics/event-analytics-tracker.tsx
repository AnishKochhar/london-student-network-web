"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

interface EventAnalyticsTrackerProps {
    eventId: string;
    eventTitle: string;
}

export default function EventAnalyticsTracker({ eventId, eventTitle }: EventAnalyticsTrackerProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        // Only track once per page load
        if (hasTracked.current) return;
        hasTracked.current = true;

        const trackView = async () => {
            try {
                // Get device type
                const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 1 : 0;

                // Get UTM parameters from URL
                const params = new URLSearchParams(window.location.search);
                const utm_source = params.get('utm_source');
                const utm_medium = params.get('utm_medium');
                const utm_campaign = params.get('utm_campaign');

                // Get referrer
                const referrer = document.referrer;

                // Track in our database
                await fetch('/api/analytics/track-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                        referrer,
                        utm_source,
                        utm_medium,
                        utm_campaign,
                        device_type: deviceType,
                    }),
                });

                // Also track in Vercel Analytics for overall site metrics
                track('Event Page View', {
                    event_id: eventId,
                    event_title: eventTitle,
                    utm_source: utm_source || 'direct',
                    device: deviceType === 1 ? 'mobile' : 'desktop'
                });
            } catch (error) {
                console.error('Analytics tracking error:', error);
            }
        };

        // Track after a small delay to ensure page is loaded
        const timer = setTimeout(trackView, 1000);

        return () => clearTimeout(timer);
    }, [eventId, eventTitle]);

    return null; // This component doesn't render anything
}
