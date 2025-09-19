"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import AuthButton from "./auth-button";
import AccountButton from "./account-button";
import { Button } from "./button";
import { useSession } from "next-auth/react";
import { motion, LayoutGroup } from "framer-motion";

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
                src="/logo/LSN LOGO 1.png"
                alt="LSN logo"
                priority
                width={96}
                height={96}
                className="w-20 md:w-24"
            />
        </Link>
    );
}

function FullScreenMenu({ closeMenu }: { closeMenu: () => void }) {
    const { data: session } = useSession();

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#041A2E] min-h-screen px-8 pt-4">
            <div className="flex justify-between items-center mb-8">
                <Logo closeMenu={closeMenu} />
                <Button
                    variant="ghost"
                    onClick={closeMenu}
                    className="text-lg font-semibold"
                >
                    Close
                </Button>
            </div>
            <div className="flex-grow flex flex-col justify-center">
                <NavLinks
                    onClick={closeMenu}
                    showAll={true}
                    className="flex flex-col items-start space-y-6 text-2xl"
                />
            </div>
            <div className="flex flex-col items-end py-8 space-y-4">
                {session?.user && (
                    <Link
                        href="/account"
                        onClick={closeMenu}
                        className="py-2 text-xl text-gray-400 hover:cursor-pointer hover:text-gray-100"
                    >
                        My Account
                    </Link>
                )}
                <AuthButton onClick={closeMenu} />
            </div>
        </div>
    );
}

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
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
                <Button
                    variant="ghost"
                    onClick={toggleMenu}
                    className="md:hidden"
                >
                    Menu
                </Button>
            </div>

            {isMenuOpen && <FullScreenMenu closeMenu={closeMenu} />}
        </header>
    );
}
