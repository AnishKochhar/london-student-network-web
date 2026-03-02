"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    UsersIcon,
    DocumentTextIcon,
    PaperAirplaneIcon,
    ChartBarIcon,
    ClockIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

const campaignNav: NavItem[] = [
    {
        name: "Contacts",
        href: "/admin/campaigns/contacts",
        icon: UsersIcon,
        description: "Manage email lists",
    },
    {
        name: "Templates",
        href: "/admin/campaigns/templates",
        icon: DocumentTextIcon,
        description: "Email templates",
    },
    {
        name: "Campaigns",
        href: "/admin/campaigns/send",
        icon: PaperAirplaneIcon,
        description: "Create & send",
    },
    {
        name: "Analytics",
        href: "/admin/campaigns/analytics",
        icon: ChartBarIcon,
        description: "Performance stats",
    },
    {
        name: "History",
        href: "/admin/campaigns/history",
        icon: ClockIcon,
        description: "Past emails",
    },
];

export default function CampaignsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isActive = (href: string) => {
        if (href === "/admin/campaigns") {
            return pathname === "/admin/campaigns";
        }
        return pathname?.startsWith(href);
    };

    // Build breadcrumbs from pathname
    const buildBreadcrumbs = () => {
        const parts = pathname?.split("/").filter(Boolean) || [];
        const crumbs: { name: string; href: string }[] = [];

        let path = "";
        parts.forEach((part) => {
            path += `/${part}`;
            const name = part.charAt(0).toUpperCase() + part.slice(1);
            crumbs.push({ name: name.replace(/-/g, " "), href: path });
        });

        return crumbs;
    };

    const breadcrumbs = buildBreadcrumbs();

    return (
        <div className="flex h-full min-h-0">
            {/* Sub-Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 64 : 220 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="relative flex-shrink-0 bg-black/20 border-r border-white/5 flex flex-col"
            >
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm font-semibold text-white"
                            >
                                Campaigns
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    >
                        {isCollapsed ? (
                            <ChevronRightIcon className="w-4 h-4" />
                        ) : (
                            <ChevronLeftIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {campaignNav.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    group flex items-center gap-3 px-3 py-2.5 rounded-lg
                                    transition-all duration-150 relative
                                    ${active
                                        ? "bg-indigo-500/20 text-white"
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }
                                `}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <Icon
                                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                        active ? "text-indigo-400" : "text-white/50 group-hover:text-white/80"
                                    }`}
                                />
                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex flex-col min-w-0"
                                        >
                                            <span className="text-sm font-medium truncate">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-white/40 truncate">
                                                {item.description}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {active && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-400 rounded-r-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {/* Breadcrumb Bar */}
                <div className="h-14 flex items-center px-6 border-b border-white/5 bg-black/10">
                    <nav className="flex items-center gap-1.5 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.href} className="flex items-center gap-1.5">
                                {index > 0 && (
                                    <ChevronRightIcon className="w-3.5 h-3.5 text-white/30" />
                                )}
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="text-white font-medium">
                                        {crumb.name}
                                    </span>
                                ) : (
                                    <Link
                                        href={crumb.href}
                                        className="text-white/50 hover:text-white transition-colors"
                                    >
                                        {crumb.name}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
