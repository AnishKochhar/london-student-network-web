"use client";

import {
    ArrowUpIcon as ArrowUpOutline,
    ArrowDownIcon as ArrowDownOutline,
} from "@heroicons/react/24/outline";
import {
    ArrowUpIcon as ArrowUpSolid,
    ArrowDownIcon as ArrowDownSolid,
} from "@heroicons/react/24/solid";
import { useVote } from "./hooks/useVote";
import { getScoreColor } from "@/app/lib/forum-utils";

interface VoteButtonsProps {
    itemId: number;
    initialUpvotes: number;
    initialDownvotes: number;
    initialUserVote: string | null;
    type: "thread" | "reply";
    size?: "small" | "medium" | "large";
    orientation?: "vertical" | "horizontal";
    onVoteChange?: (
        itemId: number,
        upvotes: number,
        downvotes: number,
        userVote: string | null,
    ) => void;
}

export default function VoteButtons({
    itemId,
    initialUpvotes,
    initialDownvotes,
    initialUserVote,
    type,
    size = "medium",
    orientation = "vertical",
    onVoteChange,
}: VoteButtonsProps) {
    const { votes, voteScore, isVoting, handleVote } = useVote({
        itemId,
        initialUpvotes,
        initialDownvotes,
        initialUserVote,
        type,
        onVoteChange,
    });

    // Get the button and text sizes based on the size prop
    const getButtonSize = () => {
        switch (size) {
            case "small":
                return { icon: "w-3 h-3", text: "text-sm" };
            case "large":
                return { icon: "w-6 h-6", text: "text-xl" };
            default:
                return { icon: "w-5 h-5", text: "text-lg" };
        }
    };

    const { icon, text } = getButtonSize();
    const scoreColor = getScoreColor(voteScore);

    if (orientation === "horizontal") {
        return (
            <div className="flex items-center gap-2">
                <button
                    className={`p-1 rounded transition-all duration-200 ${
                        votes.userVote === "upvote"
                            ? "text-green-400 bg-green-500/10"
                            : "text-white/70 hover:text-green-400 hover:bg-green-500/10"
                    } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleVote("upvote")}
                    disabled={isVoting}
                    aria-label="Upvote"
                    title="Upvote"
                >
                    {votes.userVote === "upvote" ? (
                        <ArrowUpSolid className={icon} />
                    ) : (
                        <ArrowUpOutline className={icon} />
                    )}
                </button>

                <span className={`font-bold ${text} ${scoreColor} min-w-[1.5rem] text-center`}>
                    {voteScore}
                </span>

                <button
                    className={`p-1 rounded transition-all duration-200 ${
                        votes.userVote === "downvote"
                            ? "text-red-400 bg-red-500/10"
                            : "text-white/70 hover:text-red-400 hover:bg-red-500/10"
                    } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleVote("downvote")}
                    disabled={isVoting}
                    aria-label="Downvote"
                    title="Downvote"
                >
                    {votes.userVote === "downvote" ? (
                        <ArrowDownSolid className={icon} />
                    ) : (
                        <ArrowDownOutline className={icon} />
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                className={`p-1 rounded transition-all duration-200 ${
                    votes.userVote === "upvote"
                        ? "text-green-400 bg-green-500/10"
                        : "text-white/70 hover:text-green-400 hover:bg-green-500/10"
                } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleVote("upvote")}
                disabled={isVoting}
                aria-label="Upvote"
                title="Upvote"
            >
                {votes.userVote === "upvote" ? (
                    <ArrowUpSolid className={icon} />
                ) : (
                    <ArrowUpOutline className={icon} />
                )}
            </button>

            <span className={`font-bold ${text} ${scoreColor} min-w-[1.5rem] text-center`}>
                {voteScore}
            </span>

            <button
                className={`p-1 rounded transition-all duration-200 ${
                    votes.userVote === "downvote"
                        ? "text-red-400 bg-red-500/10"
                        : "text-white/70 hover:text-red-400 hover:bg-red-500/10"
                } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleVote("downvote")}
                disabled={isVoting}
                aria-label="Downvote"
                title="Downvote"
            >
                {votes.userVote === "downvote" ? (
                    <ArrowDownSolid className={icon} />
                ) : (
                    <ArrowDownOutline className={icon} />
                )}
            </button>
        </div>
    );
}
