"use client";

import { useState } from "react";
import { FireIcon, InformationCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import { TrendingTopic } from "@/app/lib/types";

interface TrendingTopicsProps {
    topics: TrendingTopic[];
    onTopicClick?: (topicName: string) => void;
    activeTopics?: string[];
}

export default function TrendingTopics({
    topics,
    onTopicClick,
    activeTopics = [],
}: TrendingTopicsProps) {
    const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="mb-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 relative group">
                <FireIcon className="w-5 h-5 text-orange-400 animate-pulse" />
                Trending Topics
                <div
                    className="relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <InformationCircleIcon className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help transition-colors" />
                    {showTooltip && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl animate-fade-in">
                            <div className="relative">
                                Most discussed topics in the last 7 days. Click to filter threads.
                                <div className="absolute -top-3 right-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                        </div>
                    )}
                </div>
            </h3>
            <div className="space-y-2">
                {topics.map((topic, index) => {
                    const isActive = activeTopics.includes(topic.name);
                    const isHovered = hoveredTopic === topic.name;

                    return (
                        <div
                            key={topic.name}
                            onClick={() => {
                                onTopicClick?.(topic.name);
                                // Add click feedback animation
                                setHoveredTopic(topic.name);
                                setTimeout(() => setHoveredTopic(null), 200);
                            }}
                            onMouseEnter={() => setHoveredTopic(topic.name)}
                            onMouseLeave={() => setHoveredTopic(null)}
                            className={`
                                flex items-center justify-between p-3 rounded-lg cursor-pointer
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
                            <div className="flex items-center gap-2">
                                <span className={`text-white/90 font-medium ${isActive ? 'text-blue-200' : ''}`}>
                                    {topic.name}
                                </span>
                                {isActive && (
                                    <CheckIcon className="w-4 h-4 text-blue-400 animate-scale-in" />
                                )}
                            </div>
                            <span className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${isActive
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-blue-600/70 text-white/90'
                                }
                                ${isHovered ? 'animate-pulse' : ''}
                            `}>
                                {topic.count}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
