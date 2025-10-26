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

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => setIsLoaded(true);
    }, [src]);

    return (
        <div
            className="fixed inset-0 -z-50 overflow-hidden"
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
            }}
            role="img"
            aria-label={alt}
        />
    );
}
