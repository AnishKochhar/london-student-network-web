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

interface CurtainMobileMenuProps {
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
 * Curtain Drop Mobile Menu
 *
 * Features:
 * - Drops down from top like a curtain with elastic bounce
 * - Spring physics for natural, playful feel
 * - Wave effect for links (top to bottom stagger)
 * - Swipe down gesture to dismiss
 * - Proper scroll handling for small screens
 * - Multiple dismiss methods (ESC, backdrop, swipe)
 *
 * Animation sequence:
 * 1. Menu drops from top with spring bounce (600ms)
 * 2. Links wave in from top to bottom (60ms stagger)
 * 3. Hamburger flips to X with 3D rotation
 * 4. Bottom actions slide up last
 *
 * Scroll behavior:
 * - Menu is scrollable on small screens
 * - Content stays within viewport
 * - Smooth scroll with momentum
 */
export default function CurtainMobileMenu({
    isOpen,
    onClose,
    onSwitchAccount,
    navLinks,
}: CurtainMobileMenuProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const menuRef = useRef<HTMLDivElement>(null);

    // Motion value for swipe-to-dismiss gesture
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, 200], [1, 0.5]);

    // Prevent body scroll when menu is open
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

    // Handle swipe down to close
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // If swiped down more than 100px or velocity is high, close menu
        if (info.offset.y > 100 || info.velocity.y > 300) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Main curtain menu with spring drop */}
                    <motion.div
                        ref={menuRef}
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            mass: 0.8,
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        style={{
                            y,
                            opacity,
                        }}
                        className="fixed inset-x-0 top-0 z-[100] max-h-screen"
                    >
                        {/* Gradient background with grain texture */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#041A2E] via-[#064580] to-[#083157]">
                            {/* Subtle animated grain texture */}
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                }}
                            />

                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                        </div>

                        {/* Swipe indicator */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute top-2 left-1/2 -translate-x-1/2 z-10"
                        >
                            <div className="w-12 h-1 bg-white/30 rounded-full" />
                        </motion.div>

                        {/* Scrollable content container */}
                        <div className="relative h-full overflow-y-auto overflow-x-hidden">
                            {/* Inner padding container */}
                            <div className="min-h-full flex flex-col px-6 sm:px-8 pt-6 pb-8">
                                {/* Logo with fade */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{
                                        delay: 0.2,
                                        duration: 0.3,
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 15,
                                    }}
                                    className="mb-8"
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

                                {/* Navigation links with wave effect */}
                                <nav className="flex-grow flex flex-col justify-center py-4">
                                    <ul className="flex flex-col items-start space-y-4 sm:space-y-6">
                                        {navLinks.map((link, index) => (
                                            <motion.li
                                                key={link.href}
                                                initial={{
                                                    opacity: 0,
                                                    y: -20,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: -20,
                                                    scale: 0.95,
                                                }}
                                                transition={{
                                                    delay: 0.35 + index * 0.06, // Wave stagger
                                                    type: "spring",
                                                    stiffness: 250,
                                                    damping: 18,
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
                                                        "block text-2xl sm:text-3xl font-semibold transition-all",
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
                                        delay: 0.35 + navLinks.length * 0.06 + 0.15,
                                        duration: 0.35,
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 20,
                                    }}
                                    className="flex flex-col items-end space-y-3 sm:space-y-4 mt-6 sm:mt-8 pt-6 border-t border-white/10"
                                >
                                    {session?.user && (
                                        <>
                                            <Link
                                                href="/account"
                                                onClick={onClose}
                                                className="py-2 text-lg sm:text-xl text-white/90 hover:text-white hover:underline transition-all"
                                            >
                                                My Account
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    setTimeout(onSwitchAccount, 300);
                                                }}
                                                className="py-2 text-lg sm:text-xl text-white/90 hover:text-white hover:underline transition-all"
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
