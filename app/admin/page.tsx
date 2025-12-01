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
    EyeIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon,
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

        // Get revenue data from event_payments table
        let revenueResult;
        try {
            revenueResult = await sql`
                SELECT
                    COALESCE(SUM(amount_total), 0)::integer as total,
                    COALESCE(SUM(platform_fee), 0)::integer as platform_fees,
                    COALESCE(SUM(platform_fee) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::integer as platform_fees_this_month,
                    COUNT(*)::integer as total_transactions
                FROM event_payments
                WHERE payment_status IN ('succeeded', 'partially_refunded')
            `;
        } catch {
            // event_payments table might not exist yet
            revenueResult = { rows: [{ total: 0, platform_fees: 0, platform_fees_this_month: 0, total_transactions: 0 }] };
        }

        // Get analytics data from event_page_views table (same as /admin/analytics)
        let analyticsResult;
        try {
            analyticsResult = await sql`
                SELECT
                    COUNT(*)::integer as total_views,
                    COUNT(DISTINCT CASE WHEN is_unique_visitor THEN
                        COALESCE(user_id::text, CONCAT(referrer_domain, '-', DATE_TRUNC('day', viewed_at)::text))
                    END)::integer as unique_visitors,
                    COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days')::integer as views_this_week
                FROM event_page_views
                WHERE viewed_at > NOW() - INTERVAL '30 days'
            `;
        } catch {
            analyticsResult = { rows: [{ total_views: 0, unique_visitors: 0, views_this_week: 0 }] };
        }

        const analytics = analyticsResult.rows[0];
        const conversionRate = analytics.total_views > 0
            ? ((registrationsResult.rows[0].total / analytics.total_views) * 100).toFixed(2)
            : "0.00";

        return {
            events: eventsResult.rows[0],
            users: usersResult.rows[0],
            registrations: registrationsResult.rows[0],
            apiKeys: apiKeysResult.rows[0],
            revenue: revenueResult.rows[0],
            analytics: { ...analytics, conversionRate },
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            events: { total: 0, active: 0, this_week: 0 },
            users: { total: 0, new_this_week: 0 },
            registrations: { total: 0, this_week: 0 },
            apiKeys: { total: 0, active: 0 },
            revenue: { total: 0, this_month: 0, total_transactions: 0 },
            analytics: { total_views: 0, unique_visitors: 0, views_this_week: 0, conversionRate: "0.00" },
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
                {/* Quick Stats Cards - Glassmorphism Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Total Events</p>
                            <CalendarDaysIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.events.total}</p>
                        <p className="text-xs text-white/60 mt-2">
                            {stats.events.active} upcoming events
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Total Users</p>
                            <UsersIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {stats.users.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/60 mt-2">
                            +{stats.users.new_this_week} this week
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Registrations</p>
                            <TicketIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {stats.registrations.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/60 mt-2">
                            +{stats.registrations.this_week} this week
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Platform Fees</p>
                            <CurrencyPoundIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            £{(stats.revenue.platform_fees / 100).toFixed(0)}
                        </p>
                        <p className="text-xs text-white/60 mt-2">
                            £{(stats.revenue.platform_fees_this_month / 100).toFixed(0)} this month
                        </p>
                    </div>
                </div>

                {/* Analytics Overview Section */}
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Analytics Overview</h2>
                            <p className="text-sm text-white/70 mt-1">Last 30 days performance</p>
                        </div>
                        <a
                            href="/admin/analytics"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20"
                        >
                            View Full Analytics
                            <ArrowTrendingUpIcon className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-white/80">Page Views</p>
                                <EyeIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {stats.analytics.total_views.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/60 mt-2">
                                {stats.analytics.views_this_week.toLocaleString()} this week
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-white/80">Unique Visitors</p>
                                <UserGroupIcon className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {stats.analytics.unique_visitors.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/60 mt-2">Distinct users</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-white/80">Conversion Rate</p>
                                <ArrowTrendingUpIcon className="w-5 h-5 text-orange-400" />
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {stats.analytics.conversionRate}%
                            </p>
                            <p className="text-xs text-white/60 mt-2">Views to registrations</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-1">Quick Actions</h2>
                        <p className="text-sm text-white/60">Navigate to different admin sections</p>
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
                                label: "Platform Fees",
                                value: `£${(stats.revenue.platform_fees / 100).toFixed(0)}`,
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
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-white mb-6">
                        Recent Activity
                    </h2>
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SparklesIcon className="w-8 h-8 text-blue-300" />
                        </div>
                        <p className="text-sm text-white/70 font-medium">Activity feed coming soon</p>
                        <p className="text-xs text-white/50 mt-1">Track platform events and user actions in real-time</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
