"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from 'next/link';

export default async function AdminPage() {
    const session = await auth();
    if (!session) {
        redirect("/login?callbackUrl=/admin");
    }

    if (session.user?.role !== "admin") {
        redirect("/account");
    }

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-300">
                        Manage your platform, events, and communications
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    <AdminCard
                        title="Newsletter"
                        description="Send email campaigns to subscribers and manage mailing lists"
                        icon="📧"
                        href="/admin/newsletter"
                        color="blue"
                    />
                    <AdminCard
                        title="Events"
                        description="View all event listings, remove listings, and manage events"
                        icon="📅"
                        href="/admin/events"
                        color="orange"
                    />
                    <AdminCard
                        title="Analytics"
                        description="View platform statistics, user engagement, and event metrics"
                        icon="📊"
                        href="/admin/analytics"
                        color="green"
                    />
                    <AdminCard
                        title="Contact Forms"
                        description="Review and respond to user inquiries and feedback"
                        icon="💬"
                        href="/admin/contact-form"
                        color="purple"
                    />
                </div>

                {/* Platform Overview */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Platform Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatBox
                            label="Total Users"
                            value="864"
                            subtext="439 verified"
                        />
                        <StatBox
                            label="Newsletter Subscribers"
                            value="191"
                            subtext="Opted in"
                        />
                        <StatBox
                            label="Active Events"
                            value="—"
                            subtext="View in Events"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

function AdminCard({
    title,
    description,
    icon,
    href,
    color,
}: {
    title: string;
    description: string;
    icon: string;
    href: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
}) {
    const colorStyles = {
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/30 hover:border-blue-400/60',
        green: 'from-green-500/20 to-green-600/20 border-green-400/30 hover:border-green-400/60',
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-400/30 hover:border-purple-400/60',
        orange: 'from-orange-500/20 to-orange-600/20 border-orange-400/30 hover:border-orange-400/60',
    };

    return (
        <Link href={href}>
            <div className={`bg-gradient-to-br ${colorStyles[color]} border rounded-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group h-full`}>
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:underline">
                    {title}
                </h3>
                <p className="text-white/80 text-sm">
                    {description}
                </p>
            </div>
        </Link>
    );
}

function StatBox({
    label,
    value,
    subtext,
}: {
    label: string;
    value: string;
    subtext: string;
}) {
    return (
        <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">{label}</p>
            <p className="text-4xl font-bold text-white mb-1">{value}</p>
            <p className="text-gray-400 text-xs">{subtext}</p>
        </div>
    );
}
