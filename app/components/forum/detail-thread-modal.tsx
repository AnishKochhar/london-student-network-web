'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { 
  ArrowUpIcon as ArrowUpSolid, 
  ArrowDownIcon as ArrowDownSolid,
  HeartIcon as HeartSolid
} from '@heroicons/react/24/solid';

interface Reply {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  isLiked?: boolean;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

interface ThreadData {
  id: number;
  title: string;
  content: string;
  author: string;
  avatar: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  replies: Reply[];
  tags: string[];
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

interface ThreadDetailModalProps {
  isOpen: boolean;
  thread: ThreadData | null;
  onClose: () => void;
}

export default function ThreadDetailModal({ isOpen, thread, onClose }: ThreadDetailModalProps) {
  const [newReply, setNewReply] = useState('');
  const [threadVotes, setThreadVotes] = useState({
    upvotes: thread?.upvotes || 0,
    downvotes: thread?.downvotes || 0,
    isUpvoted: thread?.isUpvoted || false,
    isDownvoted: thread?.isDownvoted || false
  });
  const [replyVotes, setReplyVotes] = useState<Record<number, {
    upvotes: number;
    downvotes: number;
    isUpvoted: boolean;
    isDownvoted: boolean;
    isLiked: boolean;
  }>>({});

  const handleThreadVote = (type: 'up' | 'down') => {
    setThreadVotes(prev => {
      if (type === 'up') {
        if (prev.isUpvoted) {
          return { ...prev, upvotes: prev.upvotes - 1, isUpvoted: false };
        } else {
          return {
            ...prev,
            upvotes: prev.upvotes + 1,
            downvotes: prev.isDownvoted ? prev.downvotes - 1 : prev.downvotes,
            isUpvoted: true,
            isDownvoted: false
          };
        }
      } else {
        if (prev.isDownvoted) {
          return { ...prev, downvotes: prev.downvotes - 1, isDownvoted: false };
        } else {
          return {
            ...prev,
            downvotes: prev.downvotes + 1,
            upvotes: prev.isUpvoted ? prev.upvotes - 1 : prev.upvotes,
            isDownvoted: true,
            isUpvoted: false
          };
        }
      }
    });
  };

  const handleReplyVote = (replyId: number, type: 'up' | 'down' | 'like') => {
    setReplyVotes(prev => {
      const current = prev[replyId] || {
        upvotes: thread?.replies.find(r => r.id === replyId)?.upvotes || 0,
        downvotes: thread?.replies.find(r => r.id === replyId)?.downvotes || 0,
        isUpvoted: false,
        isDownvoted: false,
        isLiked: false
      };

      if (type === 'like') {
        return {
          ...prev,
          [replyId]: { ...current, isLiked: !current.isLiked }
        };
      }

      if (type === 'up') {
        if (current.isUpvoted) {
          return {
            ...prev,
            [replyId]: { ...current, upvotes: current.upvotes - 1, isUpvoted: false }
          };
        } else {
          return {
            ...prev,
            [replyId]: {
              ...current,
              upvotes: current.upvotes + 1,
              downvotes: current.isDownvoted ? current.downvotes - 1 : current.downvotes,
              isUpvoted: true,
              isDownvoted: false
            }
          };
        }
      } else {
        if (current.isDownvoted) {
          return {
            ...prev,
            [replyId]: { ...current, downvotes: current.downvotes - 1, isDownvoted: false }
          };
        } else {
          return {
            ...prev,
            [replyId]: {
              ...current,
              downvotes: current.downvotes + 1,
              upvotes: current.isUpvoted ? current.upvotes - 1 : current.upvotes,
              isDownvoted: true,
              isUpvoted: false
            }
          };
        }
      }
    });
  };

  const handleSubmitReply = () => {
    if (newReply.trim()) {
      // Here you would typically add the reply to the thread
      console.log('New reply:', newReply);
      setNewReply('');
    }
  };

  if (!isOpen || !thread) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ChatBubbleLeftIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Thread Discussion</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Original Thread */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-2 min-w-[60px]">
                  <button 
                    onClick={() => handleThreadVote('up')}
                    className={`p-1 hover:bg-white/10 rounded transition-colors ${threadVotes.isUpvoted ? 'text-green-400' : ''}`}
                  >
                    {threadVotes.isUpvoted ? 
                      <ArrowUpSolid className="w-5 h-5" /> : 
                      <ArrowUpIcon className="w-5 h-5" />
                    }
                  </button>
                  <span className="text-lg font-bold">{threadVotes.upvotes}</span>
                  <button 
                    onClick={() => handleThreadVote('down')}
                    className={`p-1 hover:bg-white/10 rounded transition-colors ${threadVotes.isDownvoted ? 'text-red-400' : ''}`}
                  >
                    {threadVotes.isDownvoted ? 
                      <ArrowDownSolid className="w-5 h-5" /> : 
                      <ArrowDownIcon className="w-5 h-5" />
                    }
                  </button>
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
                        <span className="text-white/60">{thread.replies.length} replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Replies Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
                Replies ({thread.replies.length})
              </h3>

              {thread.replies.map((reply) => {
                const votes = replyVotes[reply.id] || {
                  upvotes: reply.upvotes,
                  downvotes: reply.downvotes,
                  isUpvoted: false,
                  isDownvoted: false,
                  isLiked: false
                };

                return (
                  <div key={reply.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4 ml-8">
                    <div className="flex gap-3">
                      {/* Mini Vote Section */}
                      <div className="flex flex-col items-center gap-1 min-w-[40px]">
                        <button 
                          onClick={() => handleReplyVote(reply.id, 'up')}
                          className={`p-1 hover:bg-white/10 rounded transition-colors ${votes.isUpvoted ? 'text-green-400' : ''}`}
                        >
                          {votes.isUpvoted ? 
                            <ArrowUpSolid className="w-4 h-4" /> : 
                            <ArrowUpIcon className="w-4 h-4" />
                          }
                        </button>
                        <span className="text-sm font-semibold">{votes.upvotes}</span>
                        <button 
                          onClick={() => handleReplyVote(reply.id, 'down')}
                          className={`p-1 hover:bg-white/10 rounded transition-colors ${votes.isDownvoted ? 'text-red-400' : ''}`}
                        >
                          {votes.isDownvoted ? 
                            <ArrowDownSolid className="w-4 h-4" /> : 
                            <ArrowDownIcon className="w-4 h-4" />
                          }
                        </button>
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
                            onClick={() => handleReplyVote(reply.id, 'like')}
                            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors ${votes.isLiked ? 'text-red-400' : 'text-white/60'}`}
                          >
                            {votes.isLiked ? 
                              <HeartSolid className="w-4 h-4" /> : 
                              <HeartIcon className="w-4 h-4" />
                            }
                            <span className="text-sm">Like</span>
                          </button>
                          <button className="text-white/60 hover:text-white/80 text-sm transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reply Input - Fixed at bottom */}
        <div className="border-t border-white/10 p-6 bg-white/5 backdrop-blur flex-shrink-0">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              U
            </div>
            <div className="flex-1">
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage component showing integration
export function ExampleThreadModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const exampleThread: ThreadData = {
    id: 1,
    title: "What does the fox say?",
    content: "Guys! So I was in the shower last day and it just popped in my head. What does the fox say? Like really. How do they sound when they speak. I know about dogs, cats, mouse, cow, etc but fox! Never heard of it.\n\nAnyways, if any of you guys have any idea. Let me know in the comments. Thanks in advance.",
    author: "Akash Ra Dahal",
    avatar: "AD",
    timeAgo: "19h ago",
    upvotes: 57,
    downvotes: 2,
    tags: ["animals", "sounds", "fox", "question"],
    replies: [
      {
        id: 1,
        author: "Nature Expert",
        avatar: "NE",
        content: "Foxes actually make a variety of sounds! They can bark, yip, scream, and even make chattering sounds. The most common sound is a short, sharp bark.",
        timeAgo: "18h ago",
        upvotes: 23,
        downvotes: 0
      },
      {
        id: 2,
        author: "Wildlife Enthusiast",
        avatar: "WE",
        content: "I've heard foxes in the wild and they can be quite loud! During mating season, they make an eerie scream-like sound that can be pretty startling if you're not expecting it.",
        timeAgo: "17h ago",
        upvotes: 15,
        downvotes: 1
      },
      {
        id: 3,
        author: "Fox Owner",
        avatar: "FO",
        content: "I actually own a fox (legally, with permits) and they're quite vocal! They make different sounds for different emotions - excited chattering, warning barks, and content purring sounds.",
        timeAgo: "16h ago",
        upvotes: 31,
        downvotes: 0
      }
    ]
  };

  return (
    <div className="p-8 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] min-h-screen">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Open Thread Modal
      </button>
      
      <ThreadDetailModal
        isOpen={isModalOpen}
        thread={exampleThread}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}