"use client";

import Link from "next/link";
import {
    CalendarDaysIcon,
    ChartBarIcon,
    KeyIcon,
    EnvelopeIcon,
    Cog6ToothIcon,
    TicketIcon,
    ArrowRightIcon,
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

const colorMap = {
    calendar: "from-blue-500 to-blue-600",
    chart: "from-indigo-500 to-indigo-600",
    key: "from-purple-500 to-purple-600",
    envelope: "from-pink-500 to-pink-600",
    settings: "from-slate-500 to-slate-600",
    ticket: "from-emerald-500 to-emerald-600",
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
    const gradient = colorMap[iconName];

    const CardContent = (
        <div
            className={`
                relative bg-white rounded-2xl border border-slate-200 p-6
                transition-all duration-300 h-full
                ${comingSoon
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 cursor-pointer"
                }
                group
            `}
        >
            {/* Badge */}
            {badge !== undefined && badge > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {badge}
                </div>
            )}

            {/* Coming Soon Badge */}
            {comingSoon && (
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
                    Soon
                </div>
            )}

            <div className="flex flex-col h-full">
                {/* Icon */}
                <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center mb-4
                    bg-gradient-to-br ${gradient} shadow-lg
                    ${!comingSoon && "group-hover:scale-110"} transition-transform duration-300
                `}>
                    <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                            {stats.label}
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                            {stats.value}
                        </p>
                    </div>
                )}

                {/* Action indicator */}
                {!comingSoon && (
                    <div className="flex items-center gap-2 mt-4 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all">
                        <span>View details</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
    );

    if (comingSoon) {
        return CardContent;
    }

    return <Link href={href}>{CardContent}</Link>;
}
