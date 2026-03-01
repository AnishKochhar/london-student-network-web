"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UNIVERSITIES, UniversityConfig } from "@/app/lib/university-config";
import SafeImage from "../ui/safe-image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface UniversityFilterBarProps {
    activeUniversities: string[]; // Array of active university codes (empty = all active)
    onToggle: (code: string) => void;
    onSelectAll: () => void;
}

export default function UniversityFilterBar({
    activeUniversities,
    onToggle,
    onSelectAll,
}: UniversityFilterBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // All universities are active when the array is empty (no filter)
    const allActive = activeUniversities.length === 0;
    const isActive = (code: string) => allActive || activeUniversities.includes(code);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setShowLeftArrow(container.scrollLeft > 10);
        setShowRightArrow(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
    };

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 200;
        container.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-white/60 whitespace-nowrap">Filter by university:</span>
                <button
                    onClick={onSelectAll}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        allActive
                            ? "bg-blue-500/30 text-blue-200 border border-blue-400/50"
                            : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                >
                    {allActive ? "All Universities" : "Show All"}
                </button>
            </div>

            <div className="relative">
                {/* Left scroll button */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-[#041A2E] via-[#041A2E] to-transparent pl-1 pr-4 py-2"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-white/70 hover:text-white" />
                    </button>
                )}

                {/* Scrollable container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {UNIVERSITIES.map((uni, index) => (
                        <UniversityButton
                            key={uni.code}
                            university={uni}
                            isActive={isActive(uni.code)}
                            onClick={() => onToggle(uni.code)}
                            index={index}
                        />
                    ))}
                </div>

                {/* Right scroll button */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-[#041A2E] via-[#041A2E] to-transparent pr-1 pl-4 py-2"
                    >
                        <ChevronRightIcon className="w-5 h-5 text-white/70 hover:text-white" />
                    </button>
                )}
            </div>
        </div>
    );
}

interface UniversityButtonProps {
    university: UniversityConfig;
    isActive: boolean;
    onClick: () => void;
    index: number;
}

function UniversityButton({ university, isActive, onClick, index }: UniversityButtonProps) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: Math.min(index * 0.02, 0.3),
                type: "spring",
                stiffness: 300,
                damping: 20,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap
                transition-all duration-300 flex-shrink-0
                ${isActive
                    ? "bg-white/15 border border-white/40 shadow-md"
                    : "bg-black/30 border border-white/20 hover:bg-white/10 opacity-50"
                }
            `}
            title={university.fullName}
        >
            {/* Logo with fallback to initials */}
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                <SafeImage
                    src={university.logoPath}
                    alt={university.displayName}
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                    fallbackType="generic"
                    disableBlur
                />
            </div>

            {/* Display name */}
            <span
                className={`text-sm font-medium transition-all duration-300 ${
                    isActive ? "text-white" : "text-gray-400"
                }`}
            >
                {university.displayName}
            </span>
        </motion.button>
    );
}
