"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    const pathname = usePathname();

    const navigation: NavItem[] = [
        { name: "Dashboard", href: "/admin", icon: HomeIcon },
        { name: "Events", href: "/admin/events", icon: CalendarDaysIcon },
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

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-72 bg-gradient-to-b from-[#0a0a0a] via-[#083157] to-[#064580] border-r border-blue-900/50
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col shadow-xl lg:shadow-none
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logo/Brand */}
                <div className="flex items-center gap-3 h-16 px-6 border-b border-blue-800/30">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-sm">LSN</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">
                            Admin Portal
                        </h1>
                        <p className="text-xs text-blue-200">Management Dashboard</p>
                    </div>
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
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl
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
                                <span className="font-medium text-sm">{item.name}</span>
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                                )}
                                {item.badge !== undefined && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="border-t border-blue-800/30 p-4 bg-black/20">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                            {user.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                                {user.name || "Admin User"}
                            </p>
                            <p className="text-xs text-blue-200 truncate">
                                {user.email || "admin@lsn.com"}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-blue-700/50 hover:border-blue-600"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
