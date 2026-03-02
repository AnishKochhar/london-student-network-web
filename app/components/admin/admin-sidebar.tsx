"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    HomeIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    KeyIcon,
    EnvelopeIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowRightOnRectangleIcon,
    MegaphoneIcon,
    FireIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface AdminSidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
    };
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    // Auto-collapse when on campaigns routes, expand when leaving
    useEffect(() => {
        const onCampaigns = pathname?.startsWith("/admin/campaigns");
        setIsCollapsed(!!onCampaigns);
    }, [pathname]);

    const navigation: NavItem[] = [
        { name: "Dashboard", href: "/admin", icon: HomeIcon },
        { name: "Events", href: "/admin/events", icon: CalendarDaysIcon },
        { name: "Featured Event", href: "/admin/featured-event", icon: FireIcon },
        { name: "Campaigns", href: "/admin/campaigns", icon: MegaphoneIcon },
        { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
        { name: "API Keys", href: "/admin/api-keys", icon: KeyIcon },
        { name: "Contact Forms", href: "/admin/contact-forms", icon: EnvelopeIcon },
        { name: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
    ];

    const isActive = (href: string) => {
        if (href === "/admin") {
            return pathname === "/admin";
        }
        return pathname?.startsWith(href);
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
                {isOpen ? (
                    <XMarkIcon className="w-5 h-5" />
                ) : (
                    <Bars3Icon className="w-5 h-5" />
                )}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar - mobile: fixed drawer with w-72, desktop: motion-animated width */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 288 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-72 lg:w-auto
                    bg-gradient-to-b from-[#0a0a0a] via-[#083157] to-[#064580] border-r border-blue-900/50
                    transform transition-transform duration-300 ease-in-out lg:transform-none
                    flex flex-col shadow-xl lg:shadow-none overflow-hidden
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logo/Brand */}
                <div className="flex items-center gap-3 h-16 px-6 border-b border-blue-800/30 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">LSN</span>
                    </div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="min-w-0"
                            >
                                <h1 className="text-base font-bold text-white whitespace-nowrap">
                                    Admin Portal
                                </h1>
                                <p className="text-xs text-blue-200 whitespace-nowrap">Management Dashboard</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                title={isCollapsed ? item.name : undefined}
                                className={`
                                    flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl
                                    transition-all duration-200 group relative
                                    ${active
                                        ? "bg-white/10 text-white shadow-lg"
                                        : "text-blue-200 hover:bg-white/5 hover:text-white"
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                    active ? "text-white" : "text-blue-300 group-hover:text-white"
                                }`} />
                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="font-medium text-sm whitespace-nowrap"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                                )}
                                <AnimatePresence mode="wait">
                                    {!isCollapsed && item.badge !== undefined && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold"
                                        >
                                            {item.badge}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Toggle (desktop only) */}
                <div className="hidden lg:flex items-center justify-center px-4 py-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <ChevronRightIcon className="w-4 h-4" />
                        ) : (
                            <ChevronLeftIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* User Section */}
                <div className="border-t border-blue-800/30 p-4 bg-black/20">
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 mb-3 px-2"}`}>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
                            {user.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-sm font-semibold text-white truncate">
                                        {user.name || "Admin User"}
                                    </p>
                                    <p className="text-xs text-blue-200 truncate">
                                        {user.email || "admin@lsn.com"}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Link
                                    href="/logout"
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-blue-700/50 hover:border-blue-600"
                                >
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                    <span className="font-medium">Sign Out</span>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.aside>
        </>
    );
}
