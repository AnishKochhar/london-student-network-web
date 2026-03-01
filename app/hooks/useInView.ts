"use client";

import { useState, useEffect, useRef, RefObject } from "react";

interface UseInViewOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

/**
 * Hook to detect when an element enters the viewport
 * Used for lazy loading images and deferring expensive operations
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
    options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] {
    const { threshold = 0, rootMargin = "100px", triggerOnce = true } = options;
    const ref = useRef<T | null>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // If already triggered and triggerOnce is true, don't observe again
        if (isInView && triggerOnce) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsInView(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [threshold, rootMargin, triggerOnce, isInView]);

    return [ref, isInView];
}
