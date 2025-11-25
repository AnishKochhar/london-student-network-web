"use client";

import Link from "next/link";
import {
    CalendarDaysIcon,
    ChartBarIcon,
    KeyIcon,
    EnvelopeIcon,
    Cog6ToothIcon,
    TicketIcon,
} from "@heroicons/react/24/outline";

interface NavigationCardProps {
    title: string;
    description: string;
    iconName: "calendar" | "chart" | "key" | "envelope" | "settings" | "ticket";
    href: string;
    stats?: {
        label: string;
        value: string | number;
    };
    badge?: number;
    comingSoon?: boolean;
}

const iconMap = {
    calendar: CalendarDaysIcon,
    chart: ChartBarIcon,
    key: KeyIcon,
    envelope: EnvelopeIcon,
    settings: Cog6ToothIcon,
    ticket: TicketIcon,
};

export default function NavigationCard({
    title,
    description,
    iconName,
    href,
    stats,
    badge,
    comingSoon = false,
}: NavigationCardProps) {
    const Icon = iconMap[iconName];
    const CardContent = (
        <div
            className={`
                bg-white rounded-xl border-2 border-slate-200 p-6
                transition-all duration-200 h-full
                ${comingSoon
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:border-blue-500 hover:shadow-xl cursor-pointer"
                }
                group relative
            `}
        >
            {/* Badge */}
            {badge !== undefined && badge > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {badge}
                </div>
            )}

            {/* Coming Soon Badge */}
            {comingSoon && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Soon
                </div>
            )}

            <div className="flex flex-col items-center text-center gap-4">
                {/* Icon */}
                <div
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center
                        transition-colors
                        ${comingSoon
                            ? "bg-slate-100"
                            : "bg-blue-50 group-hover:bg-blue-100"
                        }
                    `}
                >
                    <Icon
                        className={`w-8 h-8 ${comingSoon ? "text-slate-400" : "text-blue-600"}`}
                    />
                </div>

                {/* Content */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">{description}</p>

                    {/* Stats */}
                    {stats && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500">{stats.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {stats.value}
                            </p>
                        </div>
                    )}

                    {/* Action Text */}
                    {!comingSoon && (
                        <p className="text-xs text-blue-600 font-medium mt-3 group-hover:underline">
                            View details →
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    if (comingSoon) {
        return CardContent;
    }

    return <Link href={href}>{CardContent}</Link>;
}
