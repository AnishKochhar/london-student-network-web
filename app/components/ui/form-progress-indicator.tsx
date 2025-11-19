"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FormProgressIndicatorProps {
    sections: Array<{
        id: string;
        label: string;
        isExpanded: boolean;
        isOptional?: boolean;
    }>;
    mandatoryEndIndex: number;
}

export function FormProgressIndicator({ sections, mandatoryEndIndex }: FormProgressIndicatorProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            // Get all section elements
            const sectionElements = sections.map(s =>
                document.getElementById(`section-${s.id}`)
            );

            // Find which section is currently in view (closest to top of viewport)
            const scrollPosition = window.scrollY + window.innerHeight / 3;

            let currentIndex = 0;
            for (let i = sectionElements.length - 1; i >= 0; i--) {
                const element = sectionElements[i];
                if (element && element.offsetTop <= scrollPosition) {
                    currentIndex = i;
                    break;
                }
            }

            setActiveIndex(currentIndex);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    return (
        <div className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-30">
            <div className="flex flex-col items-center gap-2">
                {sections.map((section, index) => {
                    const isActive = index === activeIndex;
                    const isPast = index < activeIndex;
                    const isMandatory = index <= mandatoryEndIndex;
                    const isAtBoundary = index === mandatoryEndIndex;
                    const isHovered = hoveredIndex === index;

                    return (
                        <React.Fragment key={section.id}>
                            {/* Dot */}
                            <motion.div
                                className="relative group"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    delay: index * 0.03,
                                    duration: 0.3
                                }}
                            >
                                <motion.div
                                    className={`rounded-full transition-all cursor-pointer ${
                                        isActive
                                            ? "w-2.5 h-2.5"
                                            : "w-1.5 h-1.5"
                                    } ${
                                        isPast
                                            ? "bg-green-400/70"
                                            : isActive
                                              ? "bg-white"
                                              : isMandatory
                                                ? "bg-white/30"
                                                : "bg-white/15"
                                    }`}
                                    animate={{
                                        scale: isActive ? [1, 1.15, 1] : isHovered ? 1.3 : 1,
                                    }}
                                    transition={{
                                        repeat: isActive ? Infinity : 0,
                                        duration: 2,
                                        ease: "easeInOut"
                                    }}
                                />

                                {/* Label on hover */}
                                {isHovered && (
                                    <motion.div
                                        className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap"
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="bg-white/95 backdrop-blur-sm rounded px-2 py-1 text-xs text-blue-900 font-medium shadow-lg">
                                            {section.label}
                                            {section.isOptional && (
                                                <span className="text-blue-600/70 ml-1">(optional)</span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Separator line for mandatory/optional boundary */}
                            {isAtBoundary && index < sections.length - 1 && (
                                <motion.div
                                    className="w-8 h-[1.5px] bg-gradient-to-r from-white/30 via-white/50 to-white/30 rounded-full"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                        delay: (index + 0.5) * 0.03,
                                        duration: 0.3
                                    }}
                                />
                            )}

                            {/* Connecting line */}
                            {!isAtBoundary && index < sections.length - 1 && (
                                <motion.div
                                    className={`w-[1.5px] h-4 rounded-full ${
                                        isPast
                                            ? "bg-green-400/40"
                                            : isMandatory
                                              ? "bg-white/20"
                                              : "bg-white/10"
                                    }`}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{
                                        delay: (index + 0.5) * 0.03,
                                        duration: 0.2
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
