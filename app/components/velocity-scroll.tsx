"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    useVelocity,
} from "framer-motion";

import { cn } from "@/app/lib/utils";

interface VelocityScrollProps {
    items: string[];
    default_velocity?: number;
    className?: string;
}

interface ParallaxProps {
    children: string[];
    baseVelocity: number;
    className?: string;
}

export const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function VelocityScroll({
    items,
    default_velocity = 5,
    className,
}: VelocityScrollProps) {
    function ParallaxText({
        children,
        baseVelocity = 100,
        className,
    }: ParallaxProps) {
        const baseX = useMotionValue(0);
        const { scrollY } = useScroll();
        const scrollVelocity = useVelocity(scrollY);
        const smoothVelocity = useSpring(scrollVelocity, {
            damping: 50,
            stiffness: 400,
        });

        const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
            clamp: false,
        });

        const [repetitions, setRepetitions] = useState(1);
        const containerRef = useRef<HTMLDivElement>(null);
        const textRef = useRef<HTMLSpanElement>(null);

        useEffect(() => {
            const calculateRepetitions = () => {
                if (containerRef.current && textRef.current) {
                    const containerWidth = containerRef.current.offsetWidth;
                    const textWidth = textRef.current.offsetWidth;
                    const newRepetitions =
                        Math.ceil(containerWidth / textWidth) + 2;
                    setRepetitions(newRepetitions);
                }
            };

            calculateRepetitions();

            window.addEventListener("resize", calculateRepetitions);
            return () =>
                window.removeEventListener("resize", calculateRepetitions);
        }, [children]);

        const x = useTransform(
            baseX,
            (v) => `${wrap(-100 / repetitions, 0, v)}%`,
        );

        const directionFactor = React.useRef<number>(baseVelocity > 0 ? 1 : -1);
        useAnimationFrame((t, delta) => {
            let moveBy =
                directionFactor.current *
                Math.abs(baseVelocity) *
                (delta / 1000);

            moveBy += moveBy * Math.abs(velocityFactor.get());

            baseX.set(baseX.get() + moveBy);
        });

        return (
            <div
                className="w-full overflow-hidden whitespace-nowrap"
                ref={containerRef}
            >
                <motion.div
                    className={cn("inline-block", className)}
                    style={{ x }}
                >
                    {Array.from({ length: repetitions }).map((_, i) => (
                        <span
                            key={i}
                            ref={i === 0 ? textRef : null}
                            className="inline-block mx-4"
                        >
                            {children.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="inline-block mx-8 hover:text-blue-300 transition-colors duration-200 cursor-pointer"
                                >
                                    {item}
                                </span>
                            ))}
                        </span>
                    ))}
                </motion.div>
            </div>
        );
    }

    return (
        <section className="relative w-full">
            <ParallaxText baseVelocity={default_velocity} className={className}>
                {items}
            </ParallaxText>
            <ParallaxText
                baseVelocity={-default_velocity}
                className={className}
            >
                {items}
            </ParallaxText>
        </section>
    );
}
