'use client';

import { ForumPost } from '@/types/forum-types';
import PostItem from './post-item';

interface PostListProps {
  posts: ForumPost[];
  onPostClick?: (postId: number) => void;
}

export default function PostList({ posts, onPostClick }: PostListProps) {
  return (
    <div className="space-y-6 relative z-10">
      {posts.map((post) => (
        <PostItem 
          key={post.id} 
          post={post} 
          onPostClick={onPostClick}
        />
      ))}
    </div>
  );
}