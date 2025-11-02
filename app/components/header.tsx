"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import AccountButton from "./account-button";
import { useSession } from "next-auth/react";
import { motion, LayoutGroup } from "framer-motion";
import SwitchAccountModal from "./switch-account/switch-account-modal";
import AnimatedHamburger from "./animated-hamburger";
import RadialMobileMenu from "./radial-mobile-menu";
import CurtainMobileMenu from "./curtain-mobile-menu";
import logoImage from "@/public/logo/logo.png";

/**
 * Menu Style Configuration
 *
 * Change this to switch between menu animations:
 * - "radial": Circular expansion from button (Option 2) - Enhanced with swipe gestures
 * - "curtain": Drops down from top with bounce (Option 4)
 */
const MENU_STYLE: "radial" | "curtain" = "radial"; // <-- Radial is active!

const navLinks = [
    { href: "/events", label: "Events" },
    { href: "/sponsors", label: "Sponsors" },
    { href: "/societies", label: "Societies" },
    { href: "/forum", label: "Forum" },
    { href: "/jobs", label: "Jobs", hideOnMedium: true },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact Us", hideOnMedium: true },
];

function NavLinks({
    className,
    onClick,
    showAll = false,
}: {
    className?: string;
    onClick?: () => void;
    showAll?: boolean;
}) {
    const pathname = usePathname();

    // Filter links based on showAll prop (for mobile menu vs desktop nav)
    const visibleLinks = showAll
        ? navLinks
        : navLinks.filter((link) => !link.hideOnMedium);

    return (
        <LayoutGroup>
            <ul className={clsx(className, "items-center text-white")}>
                {visibleLinks.map((link) => (
                    <motion.li
                        key={link.href}
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                        }}
                    >
                        <Link
                            href={link.href}
                            onClick={onClick}
                            className={clsx(
                                "block py-2 transition-all md:text-lg lg:text-xl",
                                pathname === link.href
                                    ? "underline"
                                    : "no-underline",
                                "hover:underline",
                            )}
                        >
                            {link.label}
                        </Link>
                    </motion.li>
                ))}
            </ul>
        </LayoutGroup>
    );
}

function Logo({ closeMenu }: { closeMenu: () => void }) {
    return (
        <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center space-x-2"
        >
            <Image
                src={logoImage}
                alt="London Student Network logo"
                priority
                className="w-20 md:w-24"
            />
        </Link>
    );
}

// FullScreenMenu component removed - replaced with RadialMobileMenu

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const { data: session } = useSession();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const handleSwitchAccount = () => {
        setShowSwitchModal(true);
    };

    return (
        <>
            <header className="sticky top-0 left-0 w-full backdrop-blur border-b-2 border-gray-300 border-opacity-25 flex justify-between items-center px-4 md:px-6 lg:px-8 shadow-md text-white bg-[#041A2E]/80 z-40">
                <Logo closeMenu={closeMenu} />

                <nav className="hidden md:flex">
                    <NavLinks
                        showAll={true}
                        className="flex space-x-4 lg:space-x-6 xl:space-x-8"
                    />
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex">
                        <AccountButton />
                    </div>

                    {/* Animated hamburger for mobile */}
                    <div className="md:hidden">
                        <AnimatedHamburger
                            isOpen={isMenuOpen}
                            onClick={toggleMenu}
                        />
                    </div>
                </div>
            </header>

            {/* Mobile menu - style controlled by MENU_STYLE constant */}
            {MENU_STYLE === "radial" ? (
                <RadialMobileMenu
                    isOpen={isMenuOpen}
                    onClose={closeMenu}
                    onSwitchAccount={handleSwitchAccount}
                    navLinks={navLinks}
                />
            ) : (
                <CurtainMobileMenu
                    isOpen={isMenuOpen}
                    onClose={closeMenu}
                    onSwitchAccount={handleSwitchAccount}
                    navLinks={navLinks}
                />
            )}

            <SwitchAccountModal
                isOpen={showSwitchModal}
                onClose={() => setShowSwitchModal(false)}
                currentUserEmail={session?.user?.email || undefined}
            />
        </>
    );
}
