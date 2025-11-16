"use client";

import { useEffect, useState } from 'react';
import { NewsletterSubscriber } from '@/app/lib/newsletter/types';
import { Button } from '@/app/components/button';

export default function SubscribersList() {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'subscribed' | 'verified'>('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(50);

    useEffect(() => {
        async function fetchSubscribers() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    page: page.toString(),
                    ...(filter === 'subscribed' && { newsletterOnly: 'true' }),
                    ...(filter === 'verified' && { verified: 'true' }),
                    ...(search && { search }),
                });

                const response = await fetch(`/api/admin/newsletter/subscribers?${params}`);
                const data = await response.json();

                if (data.success) {
                    setSubscribers(data.data.subscribers);
                    setTotal(data.data.total);
                }
            } catch (error) {
                console.error('Error fetching subscribers:', error);
            } finally {
                setLoading(false);
            }
        }

        const debounce = setTimeout(fetchSubscribers, 300);
        return () => clearTimeout(debounce);
    }, [search, filter, page, limit]);

    const totalPages = Math.ceil(total / limit);

    if (loading && subscribers.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-[#064580] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1); // Reset to page 1 on search
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <select
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value as typeof filter);
                        setPage(1); // Reset to page 1 on filter
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900"
                >
                    <option value="all">All Users</option>
                    <option value="subscribed">Newsletter Subscribers</option>
                    <option value="verified">Verified Only</option>
                </select>
            </div>

            {/* Subscribers Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                University
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subscribers.map((subscriber) => (
                            <tr key={subscriber.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {subscriber.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {subscriber.name || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {subscriber.verified_university || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            subscriber.newsletter_subscribed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {subscriber.newsletter_subscribed ? 'Subscribed' : 'Not subscribed'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {subscribers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                    No subscribers found matching your criteria.
                </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} subscriber{total !== 1 ? 's' : ''}
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

            {loading && subscribers.length > 0 && (
                <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-[#064580] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
}
