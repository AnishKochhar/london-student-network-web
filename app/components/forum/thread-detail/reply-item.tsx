import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Reply } from '@/app/lib/types';
import VoteButtons from '../vote-buttons';

interface ReplyItemProps {
  reply: Reply;
  onViewReplies: () => void;
  onVoteChange?: (replyId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
}

export default function ReplyItem({ reply, onViewReplies, onVoteChange }: ReplyItemProps) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4 ml-8">
      <div className="flex gap-3">
        {/* Mini Vote Section */}
        <div className="min-w-[40px]">
          <VoteButtons
            itemId={reply.id}
            initialUpvotes={reply.upvotes}
            initialDownvotes={reply.downvotes}
            initialUserVote={reply.userVote}
            type="reply"
            size="small"
            onVoteChange={onVoteChange}
          />
        </div>

        {/* Reply Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {reply.avatar}
            </div>
            <span className="font-medium text-white/90">{reply.author}</span>
            <span className="text-white/60">•</span>
            <span className="text-sm text-white/60">{reply.timeAgo}</span>
          </div>
          
          <p className="text-white/80 mb-3 leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={onViewReplies}
              className="text-white/60 hover:text-white/80 text-sm transition-colors flex items-center gap-1"
            >
              <ChatBubbleLeftIcon className="w-3 h-3" />
              {reply.replyCount > 0 ? (
                <span>Reply ({reply.replyCount})</span>
              ) : (
                <span>Reply</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}