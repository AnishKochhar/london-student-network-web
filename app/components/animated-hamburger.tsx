"use client";

import { motion } from "framer-motion";

interface AnimatedHamburgerProps {
    isOpen: boolean;
    onClick: () => void;
    className?: string;
}

/**
 * Animated Hamburger Menu Icon
 * Smoothly morphs between hamburger (≡) and close (×) states
 *
 * Animation:
 * - Top line: Rotates 45° and moves to center
 * - Middle line: Fades out via opacity
 * - Bottom line: Rotates -45° and moves to center
 */
export default function AnimatedHamburger({ isOpen, onClick, className = "" }: AnimatedHamburgerProps) {
    return (
        <button
            onClick={onClick}
            className={`relative w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md ${className}`}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
        >
            <div className="w-6 h-5 flex flex-col justify-between">
                {/* Top Line */}
                <motion.span
                    className="w-full h-0.5 bg-white block origin-center"
                    animate={isOpen ? {
                        rotate: 45,
                        y: 9,
                    } : {
                        rotate: 0,
                        y: 0,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                    }}
                />

                {/* Middle Line */}
                <motion.span
                    className="w-full h-0.5 bg-white block"
                    animate={isOpen ? {
                        opacity: 0,
                        scale: 0.5,
                    } : {
                        opacity: 1,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.2,
                    }}
                />

                {/* Bottom Line */}
                <motion.span
                    className="w-full h-0.5 bg-white block origin-center"
                    animate={isOpen ? {
                        rotate: -45,
                        y: -9,
                    } : {
                        rotate: 0,
                        y: 0,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                    }}
                />
            </div>
        </button>
    );
}
