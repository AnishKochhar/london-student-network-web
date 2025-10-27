"use client";

import { useState, useEffect } from "react";

interface BackgroundImageProps {
    src?: string;
    alt?: string;
}

export default function BackgroundImage({
    src = "/images/tower-bridge-1.jpeg",
    alt = "Tower Bridge Background",
}: BackgroundImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [showBackground, setShowBackground] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setIsLoaded(true);
            // Small delay to ensure DOM is ready and CSS is applied
            setTimeout(() => setShowBackground(true), 50);
        };
    }, [src]);

    return (
        <div
            className="fixed inset-0 -z-50 overflow-hidden"
            style={{
                backgroundImage: showBackground ? `url(${src})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#041A2E', // Fallback color matching your gradient
                opacity: isLoaded && showBackground ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
                minHeight: '100vh',
                minWidth: '100vw',
                willChange: 'opacity',
            }}
            role="img"
            aria-label={alt}
        />
    );
}
