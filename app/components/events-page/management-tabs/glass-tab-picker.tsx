"use client";

import { motion } from "framer-motion";
import { BarChart3, Users, Settings, LayoutDashboard, LucideIcon } from "lucide-react";

interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface GlassTabPickerProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function GlassTabPicker({ activeTab, setActiveTab }: GlassTabPickerProps) {
    const tabs: Tab[] = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "guests", label: "Guests", icon: Users },
        { id: "registration", label: "Registration", icon: Settings },
        { id: "insights", label: "Insights", icon: BarChart3 },
    ];

    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

    return (
        <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-1 sm:p-1.5 shadow-2xl border border-white/20 overflow-x-auto">
            {/* Glass shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-2xl pointer-events-none" />

            <div className="relative flex gap-1 min-w-max sm:min-w-0">
                {/* Animated slider background with glass effect */}
                <motion.div
                    className="absolute top-0 bottom-0 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/30"
                    style={{
                        boxShadow: "0 4px 16px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                    }}
                    initial={false}
                    animate={{
                        left: `calc(${activeIndex} * (100% / ${tabs.length}) + 0.125rem)`,
                        width: `calc(100% / ${tabs.length} - 0.25rem)`,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                    }}
                />

                {/* Tab buttons */}
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex-1 flex items-center justify-center gap-2
                                px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 z-10 rounded-xl
                                ${isActive ? "text-white" : "text-white/60 hover:text-white/80"}
                            `}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
