"use server";

import AdminPageHeader from "@/app/components/admin/admin-page-header";
import {
    Cog6ToothIcon,
    BellIcon,
    ShieldCheckIcon,
    PaintBrushIcon,
    EnvelopeIcon,
    CurrencyPoundIcon,
} from "@heroicons/react/24/outline";

export default async function AdminSettingsPage() {
    const settingsSections = [
        {
            title: "General Settings",
            description: "Configure platform name, logo, and basic settings",
            icon: Cog6ToothIcon,
            color: "text-blue-400",
        },
        {
            title: "Notifications",
            description: "Manage email notifications and alerts",
            icon: BellIcon,
            color: "text-amber-400",
        },
        {
            title: "Security",
            description: "Configure authentication and access controls",
            icon: ShieldCheckIcon,
            color: "text-green-400",
        },
        {
            title: "Appearance",
            description: "Customize theme and branding",
            icon: PaintBrushIcon,
            color: "text-purple-400",
        },
        {
            title: "Email Templates",
            description: "Manage email templates and content",
            icon: EnvelopeIcon,
            color: "text-pink-400",
        },
        {
            title: "Payments",
            description: "Configure Stripe and payment settings",
            icon: CurrencyPoundIcon,
            color: "text-emerald-400",
        },
    ];

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Settings"
                description="Configure platform settings and preferences"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Settings" },
                ]}
            />

            <div className="p-6 sm:p-8">
                {/* Coming Soon Banner */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl border border-white/20 p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <Cog6ToothIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Settings Coming Soon</h2>
                            <p className="text-white/70 mt-1">
                                We&apos;re building a comprehensive settings panel. Check back soon!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settingsSections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={section.title}
                                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 opacity-60 cursor-not-allowed"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Icon className={`w-6 h-6 ${section.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1">
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-white/60">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <span className="inline-flex items-center px-3 py-1 bg-white/10 text-white/50 text-xs font-medium rounded-full">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
