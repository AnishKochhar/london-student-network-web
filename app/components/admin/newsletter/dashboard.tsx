"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/button';
import OverviewStats from './overview-stats';
import SubscribersList from './subscribers-list';
import GroupsList from './groups-list';
import CampaignsList from './campaigns-list';
import CampaignWizard from './campaign-wizard';
import GroupModal from './group-modal';

type Tab = 'overview' | 'campaigns' | 'subscribers' | 'groups';

export default function NewsletterDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Newsletter Management
                    </h1>
                    <p className="text-gray-300">
                        Manage your email campaigns, subscribers, and mailing lists
                    </p>
                </div>
                <Link href="/admin">
                    <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                        ← Back to Admin
                    </Button>
                </Link>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 flex gap-2 border border-white/20 max-w-full overflow-x-auto">
                <TabButton
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </TabButton>
                <TabButton
                    active={activeTab === 'campaigns'}
                    onClick={() => setActiveTab('campaigns')}
                >
                    Campaigns
                </TabButton>
                <TabButton
                    active={activeTab === 'subscribers'}
                    onClick={() => setActiveTab('subscribers')}
                >
                    Subscribers
                </TabButton>
                <TabButton
                    active={activeTab === 'groups'}
                    onClick={() => setActiveTab('groups')}
                >
                    Groups
                </TabButton>
            </div>

            {/* Tab Content - Removed white block, now transparent with subtle background */}
            <div className="space-y-4">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'campaigns' && <CampaignsTab />}
                {activeTab === 'subscribers' && <SubscribersTab />}
                {activeTab === 'groups' && <GroupsTab />}
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 min-w-[110px] px-5 py-2.5 rounded-md font-medium transition-all duration-200 whitespace-nowrap ${
                active
                    ? 'bg-white text-[#064580] shadow-lg scale-[1.02]'
                    : 'text-white hover:bg-white/10 hover:scale-105'
            }`}
        >
            {children}
        </button>
    );
}

function OverviewTab() {
    return (
        <div className="space-y-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/30">
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            <p className="text-gray-600">
                Welcome to the newsletter management system. Use the tabs above to navigate to different sections.
            </p>

            <div className="mt-8">
                <OverviewStats />
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-[#064580]/10 to-[#041A2E]/10 rounded-lg border border-[#064580]/30">
                <h3 className="text-lg font-semibold text-[#041A2E] mb-3 flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    Quick Start Guide
                </h3>
                <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-[#064580] font-bold">1.</span>
                        <span>Check your <strong>Subscribers</strong> to see who&apos;s in your mailing list</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[#064580] font-bold">2.</span>
                        <span>Create <strong>Groups</strong> to organise recipients (e.g., &quot;All Users&quot;, &quot;Newsletter Subscribers&quot;)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[#064580] font-bold">3.</span>
                        <span>Create a <strong>Campaign</strong> with the email builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[#064580] font-bold">4.</span>
                        <span>Send a test email to yourself first</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[#064580] font-bold">5.</span>
                        <span>Send your campaign to the selected groups!</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

function CampaignsTab() {
    const [showWizard, setShowWizard] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/30 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
                    <Button
                        variant="filled"
                        onClick={() => setShowWizard(true)}
                        className="bg-[#064580] hover:bg-[#041A2E] text-white flex items-center gap-2"
                    >
                        <PlusIcon />
                        Create Campaign
                    </Button>
                </div>
                <p className="text-gray-600">
                    Manage your email campaigns. Create, edit, and send newsletters to your subscribers.
                </p>
                <CampaignsList
                    key={refreshKey}
                    onCreateClick={() => setShowWizard(true)}
                />
            </div>

            {showWizard && (
                <CampaignWizard
                    onClose={() => setShowWizard(false)}
                    onSuccess={() => {
                        setShowWizard(false);
                        setRefreshKey(prev => prev + 1);
                    }}
                />
            )}
        </>
    );
}

function SubscribersTab() {
    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        setExporting(true);
        try {
            const response = await fetch('/api/admin/newsletter/subscribers/export');

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Create a blob from the response
            const blob = await response.blob();

            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lsn-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export subscribers');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/30 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Subscribers</h2>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={exporting}
                        className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                        Import Emails
                    </Button>
                </div>
            </div>
            <p className="text-gray-600">
                View and manage all newsletter subscribers.
            </p>
            <SubscribersList />
        </div>
    );
}

function GroupsTab() {
    const [showModal, setShowModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/30 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Recipient Groups</h2>
                    <Button
                        variant="filled"
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    >
                        <PlusIcon />
                        Create Group
                    </Button>
                </div>
                <p className="text-gray-600">
                    Organise subscribers into groups for targeted campaigns.
                </p>
                <GroupsList key={refreshKey} />
            </div>

            {showModal && (
                <GroupModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        setRefreshKey(prev => prev + 1);
                    }}
                />
            )}
        </>
    );
}

function PlusIcon() {
    return (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
            />
        </svg>
    );
}
