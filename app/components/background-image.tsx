"use client";

import { useState } from "react";

interface BackgroundImageProps {
    src?: string;
    alt?: string;
    priority?: boolean;
}

export default function BackgroundImage({
    src = "/images/tower-bridge-1.jpeg",
    alt = "Tower Bridge Background",
    priority = false,
}: BackgroundImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

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
            onLoad={() => setIsLoaded(true)}
        >
            <img
                src={src}
                alt={alt}
                style={{ display: 'none' }}
                onLoad={() => setIsLoaded(true)}
            />
        </div>
    );
}
