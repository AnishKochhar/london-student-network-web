'use client';

import { ChatBubbleLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { ForumPost } from '@/types/forum-types';

interface PostItemProps {
  post: ForumPost;
  onPostClick?: (postId: number) => void;
}

export default function PostItem({ post, onPostClick }: PostItemProps) {
  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(post.id);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200">
      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-2 min-w-[60px]">
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <ArrowUpIcon className="w-5 h-5 text-green-400" />
          </button>
          <span className="text-lg font-bold">{post.upvotes}</span>
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <ArrowDownIcon className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <h2 
            className="text-xl font-semibold mb-3 hover:text-blue-300 cursor-pointer transition-colors"
            onClick={handlePostClick}
          >
            {post.title}
          </h2>
          
          <p className="text-white/80 mb-4 leading-relaxed">
            {post.content}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-600/30 border border-blue-400/30 rounded-full text-sm text-blue-300 hover:bg-blue-600/50 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Post Meta */}
          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {post.avatar}
                </div>
                <span>Posted by {post.author}</span>
                <span>•</span>
                <span>{post.timeAgo}</span>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              onClick={handlePostClick}
            >
              <ChatBubbleLeftIcon className="w-4 h-4 text-white/60" />
              <span className="text-white/60">{post.replies}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}