"use client";

import { useEffect, useState } from "react";
import {
    StarIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { FeaturedUser } from "@/app/lib/types";
import * as userService from "@/app/lib/services/thread-service";

interface FeaturedUsersProps {
    users?: FeaturedUser[];
    onAuthorClick?: (username: string) => void;
    activeAuthors?: string[];
}

interface TopUser extends FeaturedUser {
    displayName: string;
    userId: string;
    avatar: string;
    stats: {
        threads: number;
        comments: number;
        totalActivity: number;
    };
}

export default function FeaturedUsers({
    users: initialUsers,
    onAuthorClick,
    activeAuthors = [],
}: FeaturedUsersProps) {
    const [users, setUsers] = useState<TopUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Skip fetching if initial users were provided
        if (initialUsers) {
            setUsers(initialUsers as TopUser[]);
            setIsLoading(false);
            return;
        }

        async function loadTopUsers() {
            try {
                const data = await userService.fetchTopUsers();
                setUsers(data);
            } catch (err) {
                setError("Could not load top contributors");
            } finally {
                setIsLoading(false);
            }
        }

        loadTopUsers();
    }, [initialUsers]);

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <h3 className="h-6 bg-white/10 rounded w-1/2 mb-4"></h3>
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-12 bg-white/5 rounded-lg mb-3"
                    ></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 relative">
                <StarIcon className="w-5 h-5 text-yellow-400 animate-pulse" />
                Top Contributors
                <div
                    className="relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <InformationCircleIcon className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help transition-colors" />
                    {showTooltip && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl animate-fade-in">
                            <div className="relative">
                                Most active forum members this week. Click to see their threads.
                                <div className="absolute -top-3 right-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                        </div>
                    )}
                </div>
            </h3>
            <div className="space-y-2">
                {users.map((user, index) => {
                    const isActive = activeAuthors.includes(user.username);
                    const isHovered = hoveredUser === user.username;

                    return (
                        <div
                            key={user.username}
                            onClick={() => {
                                onAuthorClick?.(user.username);
                                // Add click feedback
                                setHoveredUser(user.username);
                                setTimeout(() => setHoveredUser(null), 200);
                            }}
                            onMouseEnter={() => setHoveredUser(user.username)}
                            onMouseLeave={() => setHoveredUser(null)}
                            className={`
                                flex flex-col p-3 rounded-lg cursor-pointer
                                transform transition-all duration-200 ease-out
                                ${isActive
                                    ? 'bg-blue-600/30 border border-blue-400/50 scale-[0.98]'
                                    : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20'
                                }
                                ${isHovered ? 'translate-x-1' : ''}
                                animate-slide-in
                            `}
                            style={{
                                animationDelay: `${index * 50}ms`
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isActive ? 'text-blue-200' : 'text-white/90'}`}>
                                        @{user.username}
                                    </span>
                                    {isActive && (
                                        <CheckIcon className="w-4 h-4 text-blue-400 animate-scale-in" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.status === "online" ? (
                                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    ) : (
                                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                                    )}
                                </div>
                            </div>

                            {/* Activity stats */}
                            <div className="flex items-center gap-3 text-xs text-white/70">
                                <div className="flex items-center gap-1 group">
                                    <DocumentTextIcon className="w-3 h-3 group-hover:text-white/90 transition-colors" />
                                    <span className="group-hover:text-white/90 transition-colors">
                                        {user.stats.threads} threads
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 group">
                                    <ChatBubbleLeftRightIcon className="w-3 h-3 group-hover:text-white/90 transition-colors" />
                                    <span className="group-hover:text-white/90 transition-colors">
                                        {user.stats.comments} replies
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
