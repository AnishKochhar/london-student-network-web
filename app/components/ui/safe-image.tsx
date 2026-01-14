"use client";

import Image, { ImageProps } from "next/image";
import { useState, useCallback } from "react";
import { DEFAULT_IMAGES } from "@/app/lib/default-images";

// A tiny 10x6 gray blur placeholder (base64 encoded)
// This provides instant visual feedback while images load
const DEFAULT_BLUR_DATA_URL =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAGAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEEAQQDAAAAAAAAAAAAAQIDBAURABIGITFBUWFx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQACAgMAAAAAAAAAAAAAAAABAgADERIh/9oADAMBAAIRAxEAPwC3cdT1l0uEFNBLPT0kcYl+nSOXJJ8k9z37DGpVvWdxp7dTU8NwqY4YYljjRZCAqgYAHb6xjGPqxzKzCjB7n//Z";

interface SafeImageProps extends Omit<ImageProps, "onError" | "placeholder" | "blurDataURL"> {
    fallbackSrc?: string;
    fallbackType?: keyof typeof DEFAULT_IMAGES;
    disableBlur?: boolean;
}

/**
 * SafeImage - A wrapper around Next.js Image that handles errors gracefully
 *
 * Features:
 * - Automatically falls back to a placeholder if the image fails to load
 * - Handles empty/null src values
 * - Supports custom fallback images or category-based defaults
 * - Includes blur placeholder for better perceived performance
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
    disableBlur = false,
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
            placeholder={disableBlur ? "empty" : "blur"}
            blurDataURL={disableBlur ? undefined : DEFAULT_BLUR_DATA_URL}
        />
    );
}
