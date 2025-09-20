"use client";
import { EVENT_TAG_TYPES } from "@/app/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface TagButtonsProps {
    activeTags: number[];
    toggleTag: (tag: number) => void;
}

export default function TagButtons({ activeTags, toggleTag }: TagButtonsProps) {
    const [hoveredTag, setHoveredTag] = useState<number | null>(null);

    return (
        <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(EVENT_TAG_TYPES).map((tag, index) => {
                    const tagNumber = parseInt(tag, 10);
                    const isActive = activeTags.includes(tagNumber);
                    const { label, color } = EVENT_TAG_TYPES[tagNumber];

                    return (
                        <motion.button
                            key={tag}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: index * 0.03,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full
                                transition-all duration-300
                                ${isActive
                                    ? 'bg-white/15 border border-white/40 shadow-md'
                                    : 'bg-black/30 border border-white/20 hover:bg-white/10'
                                }
                            `}
                            onClick={() => toggleTag(tagNumber)}
                            onMouseEnter={() => setHoveredTag(tagNumber)}
                            onMouseLeave={() => setHoveredTag(null)}
                        >
                            <span
                                className={`w-2.5 h-2.5 rounded-full ${color} ${isActive ? "" : "opacity-50"}`}
                            />
                            <span
                                className={`text-sm font-medium capitalize transition-all duration-300 ${
                                    isActive ? "text-white" : "text-gray-400 line-through"
                                }`}
                            >
                                {label.toLowerCase()}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {hoveredTag !== null && (
                    <motion.div
                        key={hoveredTag}
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-gray-300 italic px-2"
                    >
                        {EVENT_TAG_TYPES[hoveredTag].description}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
