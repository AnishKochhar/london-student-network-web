"use client";

import { ForumPost } from "@/app/lib/types";
import PostItem from "./post-item";

interface PostListProps {
    posts: ForumPost[];
    onPostClick?: (postId: number) => void;
    onVoteChange?: (
        postId: number,
        upvotes: number,
        downvotes: number,
        userVote: string | null,
    ) => void;
    onTagClick?: (tag: string) => void;
}

export default function PostList({
    posts,
    onPostClick,
    onVoteChange,
    onTagClick,
}: PostListProps) {
    return (
        <div className="space-y-6 relative z-10">
            {posts.map((post) => (
                <PostItem
                    key={post.id}
                    post={post}
                    onPostClick={onPostClick}
                    onVoteChange={onVoteChange}
                    onTagClick={onTagClick}
                />
            ))}
        </div>
    );
}
