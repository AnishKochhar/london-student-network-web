"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ChatBubbleLeftIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import ThreadDetailModal from "../forum/thread-detail";
import { ThreadData } from "@/app/lib/types";

interface Thread {
    id: string;
    title: string;
    content: string;
    tags: string[];
    upvotes: number;
    downvotes: number;
    score: number;
    created_at: string;
    updated_at: string;
    username: string;
    reply_count: number;
}

interface Reply {
    id: string;
    content: string;
    thread_id: string;
    parent_reply_id: string | null;
    created_at: string;
    updated_at: string;
    thread_title: string;
    username: string;
    like_count: number;
    is_liked: boolean;
}

export default function UserForumPosts() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"threads" | "replies">("threads");
    const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
    const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
    const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);

    useEffect(() => {
        fetchUserPosts();
    }, []);

    const fetchUserPosts = async () => {
        try {
            const response = await fetch("/api/forum/user-posts");
            if (!response.ok) throw new Error("Failed to fetch posts");

            const data = await response.json();
            setThreads(data.threads);
            setReplies(data.replies);
        } catch (error) {
            console.error("Error fetching forum posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleThreadClick = async (threadId: string) => {
        // Set loading state
        setLoadingThreadId(threadId);

        // Fetch the complete thread data from the API to ensure we get all replies
        try {
            const response = await fetch(`/api/threads?threadId=${threadId}`);
            if (response.ok) {
                const data = await response.json();
                // Find the specific thread from the response
                const thread = data.threads?.find((t: ThreadData) => t.id === parseInt(threadId));
                if (thread) {
                    setSelectedThread(thread);
                    setIsThreadModalOpen(true);
                } else {
                    console.error("Thread not found in API response");
                }
            } else {
                console.error("Failed to fetch thread data");
            }
        } catch (error) {
            console.error("Error fetching thread:", error);
        } finally {
            setLoadingThreadId(null);
        }
    };

    const handleReplyThreadClick = async (reply: Reply) => {
        // Set loading state
        setLoadingThreadId(reply.thread_id);

        // Fetch the actual thread data from the threads API
        try {
            const response = await fetch(`/api/threads?threadId=${reply.thread_id}`);
            if (response.ok) {
                const data = await response.json();
                // Find the specific thread from the response
                const thread = data.threads?.find((t: ThreadData) => t.id === parseInt(reply.thread_id));
                if (thread) {
                    setSelectedThread(thread);
                    setIsThreadModalOpen(true);
                }
            } else {
                console.error("Failed to fetch thread data");
            }
        } catch (error) {
            console.error("Error fetching thread:", error);
        } finally {
            setLoadingThreadId(null);
        }
    };

    const handleCloseThreadModal = () => {
        setIsThreadModalOpen(false);
        setSelectedThread(null);
    };

    const handleThreadDeleted = () => {
        // Refresh the threads list when a thread is deleted
        fetchUserPosts();
        handleCloseThreadModal();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab("threads")}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                        activeTab === "threads"
                            ? "bg-white/20 text-white"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    Threads ({threads.length})
                </button>
                <button
                    onClick={() => setActiveTab("replies")}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                        activeTab === "replies"
                            ? "bg-white/20 text-white"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    Replies ({replies.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === "threads" ? (
                <div className="space-y-4">
                    {threads.length === 0 ? (
                        <div className="text-center py-12">
                            <ChatBubbleLeftIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">You haven&apos;t created any threads yet</p>
                            <Link
                                href="/forum"
                                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Go to Forum
                            </Link>
                        </div>
                    ) : (
                        threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => !loadingThreadId && handleThreadClick(thread.id)}
                                className={`bg-white/5 rounded-lg p-4 border border-white/10 transition relative ${
                                    loadingThreadId === thread.id
                                        ? "opacity-75 cursor-wait"
                                        : loadingThreadId
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-white/10 cursor-pointer"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-white font-semibold">
                                                {thread.title}
                                            </h3>
                                            {loadingThreadId === thread.id && (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                                            )}
                                        </div>

                                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                            {thread.content}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <HeartIcon className="h-3 w-3" />
                                                {thread.upvotes}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ChatBubbleLeftIcon className="h-3 w-3" />
                                                {thread.reply_count}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                Score: {thread.score}
                                            </span>
                                            <span className="ml-auto">
                                                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {replies.length === 0 ? (
                        <div className="text-center py-12">
                            <ChatBubbleLeftIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">You haven&apos;t replied to any threads yet</p>
                            <Link
                                href="/forum"
                                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Go to Forum
                            </Link>
                        </div>
                    ) : (
                        replies.map((reply) => (
                            <div
                                key={reply.id}
                                onClick={() => !loadingThreadId && handleReplyThreadClick(reply)}
                                className={`bg-white/5 rounded-lg p-4 border border-white/10 transition relative ${
                                    loadingThreadId === reply.thread_id
                                        ? "opacity-75 cursor-wait"
                                        : loadingThreadId
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-white/10 cursor-pointer"
                                }`}
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <div>
                                        <span className="text-xs text-gray-500">Reply to: </span>
                                        <span className="text-blue-400 text-sm">
                                            {reply.thread_title}
                                        </span>
                                    </div>
                                    {loadingThreadId === reply.thread_id && (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    )}
                                </div>

                                <p className="text-gray-300 text-sm mb-3">
                                    {reply.content}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        {reply.is_liked ? (
                                            <HeartIconSolid className="h-3 w-3 text-red-500" />
                                        ) : (
                                            <HeartIcon className="h-3 w-3" />
                                        )}
                                        {reply.like_count}
                                    </span>
                                    <span className="ml-auto">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Thread Detail Modal */}
            <ThreadDetailModal
                isOpen={isThreadModalOpen}
                thread={selectedThread}
                onClose={handleCloseThreadModal}
                onThreadDelete={handleThreadDeleted}
            />
        </div>
    );
}