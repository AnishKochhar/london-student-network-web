"use client";

import { useState } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { ForumPost } from "@/app/lib/types";
import VoteButtons from "./vote-buttons";

interface PostItemProps {
    post: ForumPost;
    onPostClick?: (postId: number) => void;
    onVoteChange?: (
        postId: number,
        upvotes: number,
        downvotes: number,
        userVote: string | null,
    ) => void;
    onTagClick?: (tag: string) => void;
}

export default function PostItem({
    post,
    onPostClick,
    onVoteChange,
    onTagClick,
}: PostItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Character limit for truncated content
    const CHAR_LIMIT = 240;

    // Determine if content needs truncation based on character count
    const shouldTruncate = post.content.length > CHAR_LIMIT;

    // Get reply count badge styling based on activity level
    const getReplyCountStyle = (count: number) => {
        if (count === 0) {
            return "text-white/40";
        } else if (count < 5) {
            return "text-gray-400";
        } else if (count < 20) {
            return "text-blue-400";
        } else {
            return "text-yellow-400";
        }
    };

    const handlePostClick = () => {
        if (onPostClick) {
            onPostClick(post.id);
        }
    };

    // Prevent event propagation when clicking the expand button
    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Prevent propagation for vote buttons and other interactive elements
    const handleInteractiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Format the content based on expansion state - using character-based truncation
    const displayContent =
        shouldTruncate && !isExpanded
            ? post.content.substring(0, CHAR_LIMIT) + "..."
            : post.content;

    return (
        <div
            className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4 sm:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
            onClick={handlePostClick}
        >
            {/* Desktop layout */}
            <div className="hidden sm:flex sm:flex-row gap-4">
                {/* Desktop Vote Section */}
                <div
                    className="block min-w-[60px] flex-shrink-0"
                    onClick={handleInteractiveClick}
                >
                    <VoteButtons
                        itemId={post.id}
                        initialUpvotes={post.upvotes}
                        initialDownvotes={post.downvotes}
                        initialUserVote={post.userVote}
                        type="thread"
                        size="medium"
                        onVoteChange={onVoteChange}
                    />
                </div>

                {/* Desktop Content Section */}
                <div className="flex-1 overflow-hidden">
                    <h2
                        className="text-xl font-semibold mb-3 break-words line-clamp-2"
                        title={post.title}
                    >
                        {post.title}
                    </h2>

                    <div className="mb-4">
                        <p className="text-white/80 leading-relaxed whitespace-pre-line break-words">
                            {displayContent}
                        </p>

                        {shouldTruncate && (
                            <button
                                onClick={handleExpandClick}
                                className="flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                            >
                                {isExpanded ? (
                                    <>
                                        Show less{" "}
                                        <ChevronUpIcon className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Read more{" "}
                                        <ChevronDownIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Tags */}
                    <div
                        className="flex flex-wrap gap-2 mb-4"
                        onClick={handleInteractiveClick}
                    >
                        {post.tags.map((tag) => (
                            <button
                                key={`${post.id}-${tag}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onTagClick) {
                                        onTagClick(tag);
                                    }
                                }}
                                className="px-3 py-1 bg-blue-600/30 border border-blue-400/30 rounded-full text-sm text-blue-300 hover:bg-blue-600/50 hover:border-blue-400/50 active:bg-blue-600/60 cursor-pointer transition-all duration-200 truncate max-w-full"
                                title={`Filter by ${tag}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Post Meta */}
                    <div className="flex flex-row items-center justify-between text-sm text-white/60">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {post.avatar}
                                </div>
                                <span className="truncate">
                                    Posted by @{post.author}
                                </span>
                                <span className="flex-shrink-0">•</span>
                                <span className="flex-shrink-0">
                                    {post.timeAgo}
                                </span>
                            </div>
                        </div>

                        <div className={`flex items-center gap-2 px-2 py-1 rounded flex-shrink-0 ${
                            post.replyCount > 0 ? "bg-white/5" : ""
                        }`}>
                            <ChatBubbleLeftIcon className={`w-4 h-4 ${getReplyCountStyle(post.replyCount)}`} />
                            <span className={`font-medium ${getReplyCountStyle(post.replyCount)}`}>
                                {post.replyCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex flex-col sm:hidden gap-3">
                {/* Title row with vote buttons */}
                <div className="flex gap-3 items-start">
                    {/* Vote Section */}
                    <div
                        className="flex-shrink-0"
                        onClick={handleInteractiveClick}
                    >
                        <VoteButtons
                            itemId={post.id}
                            initialUpvotes={post.upvotes}
                            initialDownvotes={post.downvotes}
                            initialUserVote={post.userVote}
                            type="thread"
                            size="small"
                            onVoteChange={onVoteChange}
                        />
                    </div>

                    {/* Title */}
                    <h2
                        className="text-lg font-semibold flex-1 break-words line-clamp-2"
                        title={post.title}
                    >
                        {post.title}
                    </h2>
                </div>

                {/* Content Section */}
                <div className="mb-3 overflow-hidden">
                    <p className="text-white/80 leading-relaxed whitespace-pre-line break-words">
                        {displayContent}
                    </p>

                    {shouldTruncate && (
                        <button
                            onClick={handleExpandClick}
                            className="flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                        >
                            {isExpanded ? (
                                <>
                                    Show less{" "}
                                    <ChevronUpIcon className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Read more{" "}
                                    <ChevronDownIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Tags */}
                <div
                    className="flex flex-wrap gap-1.5 mb-3"
                    onClick={handleInteractiveClick}
                >
                    {post.tags.map((tag) => (
                        <button
                            key={`${post.id}-${tag}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onTagClick) {
                                    onTagClick(tag);
                                }
                            }}
                            className="px-2 py-0.5 bg-blue-600/30 border border-blue-400/30 rounded-full text-xs text-blue-300 hover:bg-blue-600/50 hover:border-blue-400/50 active:bg-blue-600/60 cursor-pointer transition-all duration-200 truncate max-w-full"
                            title={`Filter by ${tag}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Post Meta */}
                <div className="flex justify-between items-center text-xs text-white/60">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {post.avatar}
                        </div>
                        <span className="truncate max-w-[100px]">
                            Posted by @{post.author}
                        </span>
                        <span className="flex-shrink-0">•</span>
                        <span className="flex-shrink-0">{post.timeAgo}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded flex-shrink-0 ${
                        post.replyCount > 0 ? "bg-white/5" : ""
                    }`}>
                        <ChatBubbleLeftIcon className={`w-3.5 h-3.5 ${getReplyCountStyle(post.replyCount)}`} />
                        <span className={`font-medium ${getReplyCountStyle(post.replyCount)}`}>{post.replyCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
