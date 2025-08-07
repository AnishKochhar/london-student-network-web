import { ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { ThreadData } from '@/app/lib/types';
import VoteButtons from '../vote-buttons';

interface ThreadContentProps {
  thread: ThreadData;
  onVoteChange?: (threadId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
}

export default function ThreadContent({ thread, onVoteChange }: ThreadContentProps) {
  return (
    <div className="flex gap-4">
      {/* Vote Section */}
      <div className="min-w-[60px]">
        <VoteButtons
          itemId={thread.id}
          initialUpvotes={thread.upvotes}
          initialDownvotes={thread.downvotes}
          initialUserVote={thread.userVote}
          type="thread"
          size="large"
          onVoteChange={onVoteChange}
        />
      </div>

      {/* Content Section */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4 text-white">
          {thread.title}
        </h1>
        
        <p className="text-white/90 mb-4 leading-relaxed whitespace-pre-wrap">
          {thread.content}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-600/30 border border-blue-400/30 rounded-full text-sm text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Thread Meta */}
        <div className="flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                {thread.avatar}
              </div>
              <span>Posted by {thread.author}</span>
              <span>•</span>
              <span>{thread.timeAgo}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/5 transition-colors">
              <ShareIcon className="w-4 h-4" />
              <span>Share</span>
            </button>
            <div className="flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-4 h-4 text-white/60" />
              <span className="text-white/60">
                {Array.isArray(thread.replies) ? thread.replies.length : 
                (typeof thread.replies === 'number' ? thread.replies : 0)} replies
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}