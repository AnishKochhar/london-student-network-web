"use client";

import { useEffect, useState } from 'react';
import { StatsSkeleton } from './skeleton-loader';

interface Stats {
    total_subscribers: number;
    newsletter_subscribers: number;
    total_campaigns: number;
    campaigns_sent: number;
    active_groups: number;
}

export default function OverviewStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [subscribersRes, campaignsRes, groupsRes] = await Promise.all([
                    fetch('/api/admin/newsletter/subscribers?limit=1'),
                    fetch('/api/admin/newsletter/campaigns?limit=1'),
                    fetch('/api/admin/newsletter/groups'),
                ]);

                const subscribersData = await subscribersRes.json();
                const campaignsData = await campaignsRes.json();
                const groupsData = await groupsRes.json();

                setStats({
                    total_subscribers: subscribersData.data?.total || 0,
                    newsletter_subscribers: 191, // From user_information
                    total_campaigns: campaignsData.data?.total || 0,
                    campaigns_sent: 0, // Will be calculated
                    active_groups: groupsData.data?.length || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return <StatsSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                title="Total Subscribers"
                value={stats?.newsletter_subscribers.toString() || '0'}
                description="Users subscribed to newsletter"
                color="blue"
            />
            <StatCard
                title="Campaigns Sent"
                value={stats?.campaigns_sent.toString() || '0'}
                description="Total campaigns sent"
                color="green"
            />
            <StatCard
                title="Active Groups"
                value={stats?.active_groups.toString() || '0'}
                description="Recipient groups created"
                color="purple"
            />
        </div>
    );
}

function StatCard({
    title,
    value,
    description,
    color,
}: {
    title: string;
    value: string;
    description: string;
    color: 'blue' | 'green' | 'purple';
}) {
    const colorClasses = {
        blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900',
        green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-900',
        purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-900',
    };

    return (
        <div className={`p-6 rounded-lg border-2 shadow-sm ${colorClasses[color]}`}>
            <h3 className="text-sm font-medium opacity-75 mb-1">{title}</h3>
            <p className="text-4xl font-bold mb-1">{value}</p>
            <p className="text-sm opacity-75">{description}</p>
        </div>
    );
}
