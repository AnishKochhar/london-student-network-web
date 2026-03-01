/**
 * Default image configuration for fallbacks when images are missing or fail to load.
 *
 * Usage:
 * - Events without images get a category-appropriate placeholder
 * - Societies without logos get a generic society placeholder
 * - All fallbacks are local images (no external dependencies)
 */

// Event type IDs mapped to their categories (from your event_type system)
export const EVENT_TYPE_CATEGORIES: Record<number, string> = {
    1: "social",      // Social
    2: "academic",    // Academic
    3: "sports",      // Sports
    4: "cultural",    // Cultural
    5: "career",      // Career
    6: "workshop",    // Workshop
    7: "sports",      // Competition (often sports-related)
    8: "social",      // Networking
    9: "other",       // Other
};

// Map categories to placeholder images
export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
    social: "/images/placeholders/social.jpg",
    academic: "/images/placeholders/lecture-hall-1.jpg",
    sports: "/images/placeholders/football.jpg",
    cultural: "/images/placeholders/band-practice.jpg",
    career: "/images/placeholders/brainstorm.jpg",
    workshop: "/images/placeholders/teaching.jpg",
    networking: "/images/placeholders/pub.jpg",
    other: "/images/placeholders/social.jpg",
};

// Default fallbacks
export const DEFAULT_IMAGES = {
    event: "/images/placeholders/social.jpg",
    society: "/images/placeholders/pretty-logo-not-found.jpg",
    user: "/images/placeholders/pretty-logo-not-found.jpg",
    generic: "/images/placeholders/social.jpg",
} as const;

/**
 * Get the appropriate placeholder image for an event based on its type
 */
export function getEventPlaceholder(eventType?: number): string {
    if (!eventType) return DEFAULT_IMAGES.event;

    const category = EVENT_TYPE_CATEGORIES[eventType] || "other";
    return CATEGORY_PLACEHOLDERS[category] || DEFAULT_IMAGES.event;
}

/**
 * Get a valid image URL with fallback
 * Returns the provided URL if valid, otherwise returns the appropriate fallback
 */
export function getImageWithFallback(
    imageUrl: string | null | undefined,
    fallback: string = DEFAULT_IMAGES.generic
): string {
    if (!imageUrl || imageUrl.trim() === "") {
        return fallback;
    }
    return imageUrl;
}

/**
 * Get event image with smart fallback based on event type
 */
export function getEventImage(
    imageUrl: string | null | undefined,
    eventType?: number
): string {
    if (!imageUrl || imageUrl.trim() === "") {
        return getEventPlaceholder(eventType);
    }
    return imageUrl;
}

/**
 * Get society logo with fallback
 */
export function getSocietyLogo(logoUrl: string | null | undefined): string {
    return getImageWithFallback(logoUrl, DEFAULT_IMAGES.society);
}
