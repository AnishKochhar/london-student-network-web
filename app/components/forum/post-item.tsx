'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ForumPost } from '@/app/lib/types';
import VoteButtons from './vote-buttons';

interface PostItemProps {
  post: ForumPost;
  onPostClick?: (postId: number) => void;
  onVoteChange?: (postId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
}

export default function PostItem({ post, onPostClick, onVoteChange }: PostItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  
  // Word limit for truncated content
  const WORD_LIMIT = 40;
  
  // Determine if content needs truncation and prepare display content
  const words = post.content.split(/\s+/);
  const shouldTruncateContent = words.length > WORD_LIMIT;
  
  // Set truncation state on initial render
  useEffect(() => {
    setShouldTruncate(shouldTruncateContent);
  }, [shouldTruncateContent]);
  
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
  
  // Format the content based on expansion state
  const displayContent = shouldTruncate && !isExpanded
    ? words.slice(0, WORD_LIMIT).join(' ') + '...'
    : post.content;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200">
      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="min-w-[60px]">
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

        {/* Content Section */}
        <div className="flex-1">
          <h2 
            className="text-xl font-semibold mb-3 hover:text-blue-300 cursor-pointer transition-colors"
            onClick={handlePostClick}
          >
            {post.title}
          </h2>
          
          <div className="mb-4">
            <p className="text-white/80 leading-relaxed whitespace-pre-line">
              {displayContent}
            </p>
            
            {shouldTruncate && (
              <button 
                onClick={handleExpandClick}
                className="flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

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