"use client";

import { useEffect, useState } from 'react';
import { NewsletterCampaign } from '@/app/lib/newsletter/types';
import { Button } from '@/app/components/button';
import CampaignSendModal from './campaign-send-modal';
import { TableSkeleton } from './skeleton-loader';

interface CampaignsListProps {
    onCreateClick: () => void;
}

export default function CampaignsList({ onCreateClick }: CampaignsListProps) {
    const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);
    const [sendingCampaign, setSendingCampaign] = useState<NewsletterCampaign | null>(null);

    useEffect(() => {
        async function fetchCampaigns() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    page: page.toString(),
                });

                const response = await fetch(`/api/admin/newsletter/campaigns?${params}`);
                const data = await response.json();

                if (data.success) {
                    setCampaigns(data.data.campaigns);
                    setTotal(data.data.total);
                }
            } catch (error) {
                console.error('Error fetching campaigns:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCampaigns();
    }, [page, limit]);

    const totalPages = Math.ceil(total / limit);

    if (loading && campaigns.length === 0) {
        return <TableSkeleton />;
    }

    return (
        <div className="space-y-4">
            {/* Campaigns Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Campaign Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recipients
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {campaigns.map((campaign) => (
                            <tr key={campaign.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {campaign.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                    {campaign.subject}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <CampaignStatusBadge status={campaign.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {campaign.total_recipients || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(campaign.created_at).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {campaign.status === 'draft' && (
                                        <>
                                            <button className="text-[#064580] hover:text-[#041A2E] font-medium">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setSendingCampaign(campaign)}
                                                className="text-green-600 hover:text-green-800 font-medium"
                                            >
                                                Send
                                            </button>
                                        </>
                                    )}
                                    {campaign.status === 'sent' && (
                                        <button className="text-[#064580] hover:text-[#041A2E] font-medium">
                                            View Stats
                                        </button>
                                    )}
                                    {campaign.status === 'scheduled' && (
                                        <button className="text-orange-600 hover:text-orange-800 font-medium">
                                            Cancel
                                        </button>
                                    )}
                                    <button className="text-gray-600 hover:text-gray-800 font-medium">
                                        Duplicate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {campaigns.length === 0 && !loading && (
                <div className="text-center py-16">
                    <div className="inline-block p-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#064580] to-[#041A2E] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No campaigns yet</h3>
                        <p className="text-base text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                            Get started by creating your first email campaign. Build beautiful newsletters and send them to your subscribers.
                        </p>
                        <Button
                            variant="filled"
                            onClick={onCreateClick}
                            className="bg-gradient-to-r from-[#064580] to-[#041A2E] hover:from-[#041A2E] hover:to-[#064580] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto px-6 py-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Campaign
                        </Button>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} campaign{total !== 1 ? 's' : ''}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            page === pageNum
                                                ? 'bg-[#064580] text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {loading && campaigns.length > 0 && (
                <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-[#064580] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {sendingCampaign && (
                <CampaignSendModal
                    campaign={sendingCampaign}
                    onClose={() => setSendingCampaign(null)}
                    onSuccess={() => {
                        setSendingCampaign(null);
                        // Refetch campaigns to update status
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}

function CampaignStatusBadge({ status }: { status: string }) {
    const statusConfig = {
        draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
        scheduled: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Scheduled' },
        sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sending' },
        sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Sent' },
        failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
