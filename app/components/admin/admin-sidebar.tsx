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
                    w-72 bg-white border-r border-slate-200
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col shadow-xl lg:shadow-none
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logo/Brand */}
                <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-sm">LSN</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">
                            Admin Portal
                        </h1>
                        <p className="text-xs text-blue-100">Management Dashboard</p>
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
                                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                    active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                }`} />
                                <span className="font-medium text-sm">{item.name}</span>
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
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
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                            {user.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.name || "Admin User"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user.email || "admin@lsn.com"}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
