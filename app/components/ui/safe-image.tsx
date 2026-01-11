"use client";

import Image, { ImageProps } from "next/image";
import { useState, useCallback } from "react";
import { DEFAULT_IMAGES } from "@/app/lib/default-images";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
    fallbackSrc?: string;
    fallbackType?: keyof typeof DEFAULT_IMAGES;
}

/**
 * SafeImage - A wrapper around Next.js Image that handles errors gracefully
 *
 * Features:
 * - Automatically falls back to a placeholder if the image fails to load
 * - Handles empty/null src values
 * - Supports custom fallback images or category-based defaults
 *
 * Usage:
 * <SafeImage src={event.image_url} fallbackType="event" ... />
 * <SafeImage src={society.logo_url} fallbackSrc="/custom-fallback.jpg" ... />
 */
export default function SafeImage({
    src,
    fallbackSrc,
    fallbackType = "generic",
    alt,
    ...props
}: SafeImageProps) {
    const defaultFallback = fallbackSrc || DEFAULT_IMAGES[fallbackType];

    // Determine initial src - use fallback if src is empty/null
    const initialSrc = src && String(src).trim() !== "" ? src : defaultFallback;

    const [imgSrc, setImgSrc] = useState(initialSrc);
    const [hasError, setHasError] = useState(false);

    const handleError = useCallback(() => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(defaultFallback);
        }
    }, [hasError, defaultFallback]);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            onError={handleError}
        />
    );
}
