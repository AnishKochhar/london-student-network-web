import { ArrowUpIcon, ArrowDownIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { ArrowUpIcon as ArrowUpSolid, ArrowDownIcon as ArrowDownSolid } from '@heroicons/react/24/solid';
import { Reply } from '@/app/lib/types';
import { getScoreColor } from '@/app/lib/forum-utils';

interface CommentContentProps {
  comment: Reply;
  votes: {
    upvotes: number;
    downvotes: number;
    userVote: string | null;
  };
  handleVote: (voteType: 'upvote' | 'downvote') => void;
  replyCount: number;
}

export default function CommentContent({ comment, votes, handleVote, replyCount }: CommentContentProps) {
  const score = votes.upvotes - votes.downvotes;
  const scoreColor = getScoreColor(score);

  return (
    <div className="flex gap-4">
      {/* Vote Section */}
      <div className="flex flex-col items-center gap-2 min-w-[60px]">
        <button 
          onClick={() => handleVote('upvote')}
          className={`p-1 hover:bg-white/10 rounded transition-colors ${
            votes.userVote === 'upvote' ? 'text-green-400' : ''
          }`}
        >
          {votes.userVote === 'upvote' ? 
            <ArrowUpSolid className="w-5 h-5" /> : 
            <ArrowUpIcon className="w-5 h-5" />
          }
        </button>
        <span className={`text-lg font-bold ${scoreColor}`}>
          {score}
        </span>
        <button 
          onClick={() => handleVote('downvote')}
          className={`p-1 hover:bg-white/10 rounded transition-colors ${
            votes.userVote === 'downvote' ? 'text-red-400' : ''
          }`}
        >
          {votes.userVote === 'downvote' ? 
            <ArrowDownSolid className="w-5 h-5" /> : 
            <ArrowDownIcon className="w-5 h-5" />
          }
        </button>
      </div>

      {/* Comment Content Section */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
            {comment.avatar}
          </div>
          <span className="font-medium text-white/90">{comment.author}</span>
          <span className="text-white/60">•</span>
          <span className="text-sm text-white/60">{comment.timeAgo}</span>
        </div>
        
        <p className="text-white/90 mb-4 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Comment Meta */}
        <div className="flex items-center justify-between text-sm text-white/60">
          <div></div>
          <div className="flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-4 h-4 text-white/60" />
            <span className="text-white/60">
              {replyCount} replies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}