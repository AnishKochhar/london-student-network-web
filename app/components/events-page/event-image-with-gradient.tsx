"use client";

import Image from "next/image";
import { useImageColors } from "@/app/hooks/useImageColors";

interface EventImageWithGradientProps {
    src: string;
    alt: string;
    imageContain?: boolean;
    priority?: boolean;
    className?: string;
    aspectRatio?: "16/9" | "video" | "square";
}

/**
 * Reusable component for displaying event images with dynamic gradient backgrounds.
 * When imageContain is true, extracts colors from the image and applies a gradient mesh background.
 */
export default function EventImageWithGradient({
    src,
    alt,
    imageContain = false,
    priority = false,
    className = "",
    aspectRatio = "16/9",
}: EventImageWithGradientProps) {
    // Only extract colors when imageContain is true
    const { gradientMesh, gradient } = useImageColors(src, imageContain);

    const aspectClass = aspectRatio === "video"
        ? "aspect-video"
        : aspectRatio === "square"
            ? "aspect-square"
            : "aspect-[16/9]";

    return (
        <div
            className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden transition-all duration-500 ${className}`}
            style={{
                background: imageContain
                    ? (gradientMesh || gradient || "rgb(243 244 246)")
                    : "rgb(243 244 246)"
            }}
        >
            <Image
                src={src}
                alt={alt}
                fill
                className={imageContain ? "object-contain" : "object-cover"}
                priority={priority}
            />
        </div>
    );
}
