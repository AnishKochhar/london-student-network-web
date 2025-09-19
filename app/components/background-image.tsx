"use client";

import Image from "next/image";
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
        <div className="fixed inset-0 -z-50 overflow-hidden">
            <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                style={{
                    objectFit: "cover",
                    objectPosition: "center center",
                    transition: isLoaded ? "none" : "opacity 0.3s ease-in-out",
                }}
                sizes="100vw"
                quality={90}
                onLoad={() => setIsLoaded(true)}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLDCAG3k/CjVWeldd+XTvz6hpOk3sVuwwCo44CtTNcyM90eGWQCJ4sDyj8iARyKEUHJVDyCYkxqwSZ5Fk5m/ZdBHZ8HhlyRE6j8uTjhp6l+p4e/zOkT7D9rlTAV5q3CQgKQ8lfgDy2/x3xKR+bnK5vtRCM5jZhWHHERbgNk+GIWxD1uo5rCnYb7b9+xSTm7HMNI6sIaLj8oSMjy0z/9k="
            />
        </div>
    );
}
