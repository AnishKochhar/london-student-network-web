"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import AuthButton from "./auth-button";
import clsx from "clsx";
import logoImage from "@/public/logo/logo.png";

interface RadialMobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchAccount: () => void;
    navLinks: Array<{
        href: string;
        label: string;
        hideOnMedium?: boolean;
    }>;
}

/**
 * Radial Expanding Mobile Menu - Enhanced
 *
 * Features:
 * - Circular expansion animation from top-right corner
 * - Spiral rotation effect for menu links
 * - Animated gradient background sweep
 * - Smooth scale and rotate transitions
 * - Swipe-right gesture to dismiss
 * - Advanced scroll handling for small screens
 * - Multiple dismiss methods (ESC, backdrop, swipe)
 *
 * Animation sequence:
 * 1. Circular clip-path expands from button position (500ms)
 * 2. Gradient sweeps across background
 * 3. Links rotate and scale in with stagger (40ms delay each)
 * 4. Bottom actions fade in last
 *
 * Usability:
 * - Scrollable on small screens
 * - Prevents body scroll (iOS compatible)
 * - Maintains scroll position on close
 * - Swipe right to dismiss
 * - Large touch targets for mobile
 */
export default function RadialMobileMenu({
    isOpen,
    onClose,
    onSwitchAccount,
    navLinks,
}: RadialMobileMenuProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const menuRef = useRef<HTMLDivElement>(null);

    // Motion values for swipe-to-dismiss
    const x = useMotionValue(0);
    const opacity = useTransform(x, [0, 300], [1, 0.3]);

    // Prevent body scroll when menu is open (iOS compatible)
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                // Restore scroll position
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    // Close menu on ESC key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Handle swipe right to close
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // If swiped right more than 150px or velocity is high, close menu
        if (info.offset.x > 150 || info.velocity.x > 400) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with gradient sweep */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Main menu container with radial expansion and swipe support */}
                    <motion.div
                        ref={menuRef}
                        initial={{
                            clipPath: "circle(0% at calc(100% - 2rem) 2rem)",
                        }}
                        animate={{
                            clipPath: "circle(150% at calc(100% - 2rem) 2rem)",
                        }}
                        exit={{
                            clipPath: "circle(0% at calc(100% - 2rem) 2rem)",
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 25,
                            duration: 0.5,
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0, right: 0.5 }}
                        onDragEnd={handleDragEnd}
                        style={{
                            x,
                            opacity,
                        }}
                        className="fixed inset-0 z-[100] max-h-screen"
                    >
                        {/* Animated gradient background */}
                        <motion.div
                            initial={{ backgroundPosition: "0% 50%" }}
                            animate={{ backgroundPosition: "100% 50%" }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                            }}
                            className="absolute inset-0 bg-gradient-to-br from-[#041A2E] via-[#064580] to-[#083157]"
                            style={{
                                backgroundSize: "200% 200%",
                            }}
                        />

                        {/* Glass morphism overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />

                        {/* Swipe indicator - subtle hint for gesture */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                        >
                            <div className="flex flex-col space-y-1">
                                <div className="w-1 h-8 bg-white/20 rounded-full" />
                                <div className="w-1 h-6 bg-white/15 rounded-full" />
                            </div>
                        </motion.div>

                        {/* Scrollable menu content */}
                        <div className="relative h-full overflow-y-auto overflow-x-hidden">
                            <div className="min-h-full flex flex-col px-6 sm:px-8 pt-4 pb-8">
                                {/* Logo */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="mb-12"
                                >
                                    <Link
                                        href="/"
                                        onClick={onClose}
                                        className="flex items-center space-x-2"
                                    >
                                        <Image
                                            src={logoImage}
                                            alt="London Student Network logo"
                                            priority
                                            className="w-20"
                                        />
                                    </Link>
                                </motion.div>

                                {/* Navigation links with spiral animation */}
                                <nav className="flex-grow flex flex-col justify-center py-4">
                                    <ul className="flex flex-col items-start space-y-4 sm:space-y-6">
                                        {navLinks.map((link, index) => (
                                            <motion.li
                                                key={link.href}
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                    rotate: -45,
                                                    x: -30,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    rotate: 0,
                                                    x: 0,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                    rotate: 45,
                                                    x: 30,
                                                }}
                                                transition={{
                                                    delay: 0.3 + index * 0.04,
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 20,
                                                }}
                                                whileHover={{
                                                    scale: 1.05,
                                                    x: 8,
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full"
                                            >
                                                <Link
                                                    href={link.href}
                                                    onClick={onClose}
                                                    className={clsx(
                                                        "block py-2 text-2xl sm:text-3xl font-semibold transition-all min-h-[44px] flex items-center",
                                                        pathname === link.href
                                                            ? "text-white underline decoration-2 underline-offset-4"
                                                            : "text-white/85 hover:text-white"
                                                    )}
                                                >
                                                    {link.label}
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </nav>

                                {/* Bottom actions with slide up */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 30 }}
                                    transition={{
                                        delay: 0.3 + navLinks.length * 0.04 + 0.1,
                                        duration: 0.3,
                                    }}
                                    className="flex flex-col items-end space-y-3 sm:space-y-4 mt-6 sm:mt-8 pt-6 border-t border-white/10"
                                >
                                    {session?.user && (
                                        <>
                                            <Link
                                                href="/account"
                                                onClick={onClose}
                                                className="py-2 text-lg sm:text-xl text-white/90 hover:text-white hover:underline transition-all min-h-[44px] flex items-center"
                                            >
                                                My Account
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    setTimeout(onSwitchAccount, 300);
                                                }}
                                                className="py-2 text-lg sm:text-xl text-white/90 hover:text-white hover:underline transition-all min-h-[44px] flex items-center"
                                            >
                                                Switch Account
                                            </button>
                                        </>
                                    )}
                                    <AuthButton onClick={onClose} />
                                </motion.div>

                                {/* Extra padding at bottom for small screens */}
                                <div className="h-8 sm:h-4" />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
