"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/button";
import toast from "react-hot-toast";
import type { LinkedInPostQueue } from "@/app/lib/types/linkedin";

export default function LinkedInPostApprover() {
    const [posts, setPosts] = useState<LinkedInPostQueue[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/linkedin/queue');
            const data = await response.json();

            if (data.success) {
                setPosts(data.posts);
            } else {
                toast.error('Failed to fetch posts');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('Error loading posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleApprove = async (queueId: string) => {
        setActionLoading(queueId);
        try {
            const response = await fetch('/api/linkedin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queueId }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Post approved and published to LinkedIn!');
                await fetchPosts(); // Refresh list
            } else {
                toast.error(data.error || 'Failed to approve post');
            }
        } catch (error) {
            console.error('Error approving post:', error);
            toast.error('Error approving post');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (queueId: string) => {
        const reason = rejectionReason[queueId] || '';

        if (!reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setActionLoading(queueId);
        try {
            const response = await fetch('/api/linkedin/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queueId, reason }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Post rejected');
                await fetchPosts(); // Refresh list
                setRejectionReason({ ...rejectionReason, [queueId]: '' });
            } else {
                toast.error(data.error || 'Failed to reject post');
            }
        } catch (error) {
            console.error('Error rejecting post:', error);
            toast.error('Error rejecting post');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingPosts = posts.filter((p) => p.status === 'pending');
    const recentPosts = posts.filter((p) => p.status !== 'pending');

    if (loading) {
        return (
            <div className="w-full max-w-4xl p-6 text-white text-center">
                Loading posts...
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl p-6 space-y-8">
            {/* Pending Posts */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                    Pending Approval ({pendingPosts.length})
                </h2>

                {pendingPosts.length === 0 ? (
                    <div className="bg-white/10 rounded-lg p-8 text-white text-center">
                        No posts pending approval
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendingPosts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-white rounded-lg shadow-lg p-6 space-y-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs text-gray-500">
                                            Created: {new Date(post.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                        Pending
                                    </span>
                                </div>

                                {/* Event Info */}
                                {post.event_data && Array.isArray(post.event_data) && (
                                    <div className="bg-blue-50 p-3 rounded">
                                        <p className="text-sm font-medium text-blue-900 mb-2">
                                            Featured Events:
                                        </p>
                                        {post.event_data.map((event: { title: string; organiser: string }, idx: number) => (
                                            <p key={idx} className="text-sm text-blue-800">
                                                • {event.title} by {event.organiser}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Post Content */}
                                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Post Preview:
                                    </p>
                                    <div className="whitespace-pre-wrap text-gray-900">
                                        {post.post_content}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {post.post_content.length} characters
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rejection Reason (optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="Why is this post being rejected?"
                                            value={rejectionReason[post.id] || ''}
                                            onChange={(e) =>
                                                setRejectionReason({
                                                    ...rejectionReason,
                                                    [post.id]: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleReject(post.id)}
                                        disabled={actionLoading === post.id}
                                        variant="outline"
                                        className="border-red-500 text-red-500 hover:bg-red-50"
                                    >
                                        {actionLoading === post.id ? 'Rejecting...' : 'Reject'}
                                    </Button>
                                    <Button
                                        variant="filled"
                                        onClick={() => handleApprove(post.id)}
                                        disabled={actionLoading === post.id}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {actionLoading === post.id
                                            ? 'Publishing...'
                                            : 'Approve & Publish'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Recent Posts History */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                    Recent History ({recentPosts.length})
                </h2>

                {recentPosts.length === 0 ? (
                    <div className="bg-white/10 rounded-lg p-8 text-white text-center">
                        No post history yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentPosts.slice(0, 10).map((post) => (
                            <div
                                key={post.id}
                                className="bg-white/95 rounded-lg p-4 flex justify-between items-start"
                            >
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-gray-900 line-clamp-2 mt-1">
                                        {post.post_content.substring(0, 150)}...
                                    </p>
                                    {post.rejection_reason && (
                                        <p className="text-sm text-red-600 mt-2">
                                            Reason: {post.rejection_reason}
                                        </p>
                                    )}
                                </div>
                                <div className="ml-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            post.status === 'published' || post.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {post.status}
                                        {post.auto_approved && ' (auto)'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
