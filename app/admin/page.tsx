"use server";

import { sql } from "@vercel/postgres";
import AdminPageHeader from "../components/admin/admin-page-header";
import NavigationCard from "../components/admin/navigation-card";
import {
    CalendarDaysIcon,
    UsersIcon,
    CurrencyPoundIcon,
    SparklesIcon,
    TicketIcon,
} from "@heroicons/react/24/outline";

async function getDashboardStats() {
    try {
        // Get total events and active (upcoming) events
        const eventsResult = await sql`
            SELECT
                COUNT(*)::integer as total,
                COUNT(*) FILTER (WHERE start_datetime > NOW())::integer as active,
                COUNT(*) FILTER (WHERE start_datetime > NOW() - INTERVAL '7 days')::integer as this_week
            FROM events
            WHERE deleted_at IS NULL
        `;

        // Get total users and new users this week
        const usersResult = await sql`
            SELECT
                COUNT(*)::integer as total,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::integer as new_this_week
            FROM users
        `;

        // Get total registrations
        const registrationsResult = await sql`
            SELECT
                COUNT(*)::integer as total,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::integer as this_week
            FROM event_registrations
        `;

        // Get API keys count
        const apiKeysResult = await sql`
            SELECT
                COUNT(*)::integer as total,
                COUNT(*) FILTER (WHERE is_active = true)::integer as active
            FROM api_keys
        `;

        // Get revenue data (if transactions table exists)
        let revenueResult;
        try {
            revenueResult = await sql`
                SELECT
                    COALESCE(SUM(amount_total), 0)::integer as total,
                    COALESCE(SUM(amount_total) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::integer as this_month
                FROM transactions
                WHERE status = 'completed'
            `;
        } catch (error) {
            // Transactions table might not exist yet
            revenueResult = { rows: [{ total: 0, this_month: 0 }] };
        }

        return {
            events: eventsResult.rows[0],
            users: usersResult.rows[0],
            registrations: registrationsResult.rows[0],
            apiKeys: apiKeysResult.rows[0],
            revenue: revenueResult.rows[0],
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            events: { total: 0, active: 0, this_week: 0 },
            users: { total: 0, new_this_week: 0 },
            registrations: { total: 0, this_week: 0 },
            apiKeys: { total: 0, active: 0 },
            revenue: { total: 0, this_month: 0 },
        };
    }
}

export default async function AdminDashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Dashboard"
                description="Welcome to the LSN Admin Dashboard"
            />

            <div className="p-6 sm:p-8 space-y-8">
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Total Events</p>
                            <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.events.total}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {stats.events.active} upcoming
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Total Users</p>
                            <UsersIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {stats.users.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            +{stats.users.new_this_week} this week
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Registrations</p>
                            <TicketIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {stats.registrations.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            +{stats.registrations.this_week} this week
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Revenue</p>
                            <CurrencyPoundIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            £{(stats.revenue.total / 100).toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            £{(stats.revenue.this_month / 100).toFixed(0)} this month
                        </p>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <SparklesIcon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <NavigationCard
                            title="Events"
                            description="Manage all platform events"
                            iconName="calendar"
                            href="/admin/events"
                            stats={{
                                label: "Active Events",
                                value: stats.events.active,
                            }}
                        />

                        <NavigationCard
                            title="Analytics"
                            description="View platform statistics"
                            iconName="chart"
                            href="/admin/analytics"
                            stats={{
                                label: "Total Registrations",
                                value: stats.registrations.total.toLocaleString(),
                            }}
                        />

                        <NavigationCard
                            title="API Keys"
                            description="Manage integration keys"
                            iconName="key"
                            href="/admin/api-keys"
                            stats={{
                                label: "Active Keys",
                                value: stats.apiKeys.active,
                            }}
                        />

                        <NavigationCard
                            title="Contact Forms"
                            description="Review submissions"
                            iconName="envelope"
                            href="/admin/contact-forms"
                        />

                        <NavigationCard
                            title="Tickets & Sales"
                            description="Revenue and transactions"
                            iconName="ticket"
                            href="/admin/tickets"
                            stats={{
                                label: "Total Revenue",
                                value: `£${(stats.revenue.total / 100).toFixed(0)}`,
                            }}
                            comingSoon
                        />

                        <NavigationCard
                            title="Settings"
                            description="Platform configuration"
                            iconName="settings"
                            href="/admin/settings"
                            comingSoon
                        />
                    </div>
                </div>

                {/* Recent Activity Section (Future Enhancement) */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Recent Activity
                    </h2>
                    <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">Activity feed coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
