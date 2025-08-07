'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ThreadData } from '@/app/lib/types';
import { useSession } from 'next-auth/react';

import ThreadContent from './thread-content';
import CommentContent from './comment-content';
import ReplyItem from './reply-item';
import ReplyForm from './reply-form';
import { useVotes } from './hooks/useVotes';
import { useCommentNav } from './hooks/useCommentNav';
import { useReplies } from './hooks/useReplies';


interface ThreadDetailModalProps {
  isOpen: boolean;
  thread: ThreadData | null;
  onClose: () => void;
  isRepliesLoading?: boolean;
  onThreadVoteChange?: (threadId: number, upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote') => void;
}

export default function ThreadDetailModal({ 
  isOpen, 
  thread, 
  onClose,
  isRepliesLoading = false,
  onThreadVoteChange
}: ThreadDetailModalProps) {
  const { data: session } = useSession();
  const [newReply, setNewReply] = useState('');
  const [isLoadingCommentReplies, setIsLoadingCommentReplies] = useState(false);
  
  // Custom hooks
  const { 
    viewContext, 
    viewHistory, 
    navigateToComment, 
    navigateBack 
  } = useCommentNav(thread);
  
  const {
    replyVotes,
    handleReplyVote
  } = useVotes(thread);
  
  const {
    isSubmitting,
    commentReplies,
    fetchCommentReplies,
    handleSubmitReply
  } = useReplies({
    thread,
    viewContext,
    setIsLoadingCommentReplies,
    setNewReply
  });
  
  // Initialize view context when thread changes
  useEffect(() => {
    if (thread && (!Array.isArray(thread.replies) || thread.replies.length === 0)) {
      fetchThreadReplies(thread.id);
    }
  }, [thread]);

  useEffect(() => {
  // When the view context changes to a comment view, fetch its replies
  if (viewContext?.type === 'comment') {
    fetchCommentReplies(viewContext.commentId);
  }
}, [viewContext]);
    
  const handleVoteChange = (threadId: number, upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote') => {
    // Update the thread in both local state and parent component
    if (thread && threadId === thread.id) {
      thread.upvotes = upvotes;
      thread.downvotes = downvotes;
      thread.userVote = userVote;
      
      // Propagate to parent component
      if (onThreadVoteChange) {
        onThreadVoteChange(threadId, upvotes, downvotes, userVote);
      }
    }
  };
  
  // Handle reply vote changes
  const handleReplyVoteChange = (replyId: number, upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote') => {
    // Find and update the reply
    if (thread && Array.isArray(thread.replies)) {
      const updatedReplies = thread.replies.map(reply => {
        if (reply.id === replyId) {
          return {
            ...reply,
            upvotes,
            downvotes,
            userVote
          };
        }
        return reply;
      });
      thread.replies = updatedReplies;
    }
  };

  // Function to fetch thread replies if they're not already loaded
  const fetchThreadReplies = async (threadId: number) => {
    if (!thread) return;
    
    try {
      const response = await fetch(`/api/threads/${threadId}/replies`);
      if (!response.ok) {
        throw new Error('Failed to fetch thread replies');
      }
      const replies = await response.json();
      
      // Update thread replies
      if (thread && Array.isArray(replies)) {
        thread.replies = replies;
      }
    } catch (error) {
      console.error('Error fetching thread replies:', error);
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
            {viewContext?.type === 'comment' && (
              <button 
                onClick={navigateBack} 
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-white/80" />
              </button>
            )}
            <ChatBubbleLeftIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              {viewContext?.type === 'comment' ? 
                (viewHistory.length > 0 ? 'Reply' : 'Comment Thread') : 
                'Thread Discussion'}
            </h2>
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
            {/* Main Content (Thread or Comment) */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              {viewContext?.type === 'thread' ? (
                <ThreadContent 
                  thread={thread} 
                  onVoteChange={handleVoteChange}
                />
              ) : viewContext ? (
                <CommentContent 
                  comment={viewContext.comment} 
                  votes={replyVotes[viewContext.commentId] || {
                    upvotes: viewContext.comment.upvotes,
                    downvotes: viewContext.comment.downvotes,
                    userVote: viewContext.comment.userVote
                  }}
                  handleVote={(voteType) => handleReplyVote(viewContext.commentId, voteType)}
                  replyCount={commentReplies.length} 
                />
              ) : null}
            </div>

            {/* Replies Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
                {viewContext?.type === 'comment' ? 'Replies to this comment' : 'Replies'}
              </h3>

              {viewContext?.type === 'thread' ? (
                // Thread replies
                isRepliesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : !Array.isArray(thread.replies) || thread.replies.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center text-white/60">
                    No replies yet. Be the first to reply!
                  </div>
                ) : (
                  thread.replies.map((reply) => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      onViewReplies={() => navigateToComment(reply)}
                      onVoteChange={handleReplyVoteChange}
                    />
                  ))
                )
              ) : viewContext ? (
                // Comment replies
                isLoadingCommentReplies ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : commentReplies.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center text-white/60">
                    No replies to this comment yet. Be the first to reply!
                  </div>
                ) : (
                  commentReplies.map((reply) => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      onViewReplies={() => navigateToComment(reply)}
                    />
                  ))
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Reply Input Form */}
        <ReplyForm
          session={session}
          newReply={newReply}
          setNewReply={setNewReply}
          isSubmitting={isSubmitting}
          handleSubmitReply={() => handleSubmitReply(newReply)}
          viewContext={viewContext}
        />
      </div>
    </div>
  );
}