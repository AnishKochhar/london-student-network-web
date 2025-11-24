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
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg"
            >
                {isOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                ) : (
                    <Bars3Icon className="w-6 h-6" />
                )}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 bg-slate-900 text-slate-300
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logo/Brand */}
                <div className="flex items-center justify-center h-16 border-b border-slate-800 px-4">
                    <h1 className="text-xl font-bold text-white">
                        LSN Admin
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                                    transition-colors group relative
                                    ${active
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{item.name}</span>
                                {item.badge !== undefined && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user.name || "Admin"}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {user.email || "admin@lsn.com"}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Sign Out</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
