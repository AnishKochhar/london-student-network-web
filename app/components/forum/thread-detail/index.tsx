'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ChatBubbleLeftIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ThreadData, Reply, ViewContext as ImportedViewContext } from '@/app/lib/types';
import { useSession } from 'next-auth/react';

import ThreadContent from './thread-content';
import CommentContent from './comment-content';
import ReplyList from './reply-list';
import ReplyForm from './reply-form';
import { useCommentNav } from './hooks/useCommentNav';
import { useThreadState } from '@/app/lib/hooks/useThreadState';
import * as threadService from '@/app/lib/services/thread-service';

// Define proper types for thread updates
interface ThreadUpdateData {
  title?: string;
  content?: string;
  tags?: string[];
  upvotes?: number;
  downvotes?: number;
  userVote?: 'upvote' | 'downvote' | null;
  replies?: number; 
  wasEdited?: boolean;
  editedTimeAgo?: string;
}

type ViewContext = ImportedViewContext;

// Define view context types
type CommentData = {
  id: number;
  content: string;
  author: string;
  authorId: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  replyCount: number;
  wasEdited?: boolean;
  editedTimeAgo?: string;
};

interface ThreadDetailModalProps {
  isOpen: boolean;
  thread: ThreadData | null;
  onClose: () => void;
  isRepliesLoading?: boolean;
  onThreadVoteChange?: (threadId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onThreadContentUpdate?: (threadId: number, updatedData: ThreadUpdateData) => void; 
  onThreadDelete?: (threadId: number) => void; 
}

const ThreadDetailModal = ({ 
  isOpen, 
  thread: initialThread, 
  onClose,
  isRepliesLoading = false,
  onThreadVoteChange,
  onThreadContentUpdate,
  onThreadDelete
}: ThreadDetailModalProps) => {
  const { data: session } = useSession();
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCommentReplies, setIsLoadingCommentReplies] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Use our centralized thread state management
  const {
    threadData,
    commentReplies,
    setThreadData,
    updateThread,
    updateReply,
    addReply,
    deleteReply,
    setReplies,
    setCommentReplies
  } = useThreadState(initialThread);
  
  // Use a ref to keep track of which threads we've already fetched replies for
  const fetchedThreadReplies = useRef(new Set<number>());
  
  // Custom hooks
  const { 
    viewContext, 
    navigateToComment, 
    navigateBack,
    setViewContext
  } = useCommentNav(threadData);
  
  // Initialize thread data when the prop changes
  useEffect(() => {
    if (initialThread) {
      // First check if the thread ID is changing - if so, clear the fetched replies set
      if (threadData?.id !== initialThread.id) {
        fetchedThreadReplies.current = new Set();
      }
      
      setThreadData(initialThread);
    }
  }, [initialThread, threadData?.id, setThreadData]);
  
  // This effect runs after threadData is set and checks if we need to fetch replies
  useEffect(() => {
    const fetchRepliesIfNeeded = async () => {
      if (
        threadData && 
        threadData.id && 
        !fetchedThreadReplies.current.has(threadData.id) && 
        (!threadData.replies || !Array.isArray(threadData.replies))
      ) {
        // Mark this thread ID as having had its replies fetched
        fetchedThreadReplies.current.add(threadData.id);
        
        // Now fetch the replies
        const replies = await threadService.fetchThreadReplies(threadData.id);
        setReplies(replies);
      }
    };
    
    fetchRepliesIfNeeded();
  }, [threadData, setReplies]);

  // When the view context changes to a comment view, fetch its replies
  useEffect(() => {
    const fetchCommentRepliesIfNeeded = async () => {
      if (viewContext?.type === 'comment') {
        setIsLoadingCommentReplies(true);
        const replies = await threadService.fetchCommentReplies(viewContext.commentId);
        setCommentReplies(replies);
        setIsLoadingCommentReplies(false);
      }
    };
    
    fetchCommentRepliesIfNeeded();
  }, [viewContext, setCommentReplies]);
    
  const handleVoteChange = useCallback((threadId: number, upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote') => {
    // Update thread in state
    updateThread(threadId, { upvotes, downvotes, userVote });
    
    // Propagate to parent component
    if (onThreadVoteChange) {
      onThreadVoteChange(threadId, upvotes, downvotes, userVote);
    }
  }, [updateThread, onThreadVoteChange]);
  
  // Update handleSubmitReply to increment reply count of parent thread
  const handleSubmitReply = useCallback(async (replyContent: string) => {
    if (!threadData || !replyContent.trim()) return;
    
    setIsSubmitting(true);
    
    // Determine the parentId based on the current view context
    const parentId = viewContext?.type === 'comment' ? viewContext.commentId : null;
    
    const newReply = await threadService.submitReply(
      threadData.id, 
      replyContent.trim(),
      parentId
    );
    
    if (newReply) {
      // Add to the appropriate list
      addReply(newReply, parentId);
      
      // If we're in a comment view, also update the comment's reply count
      if (viewContext?.type === 'comment' && viewContext.comment) {
        const updatedComment = { ...viewContext.comment };
        updatedComment.replyCount = (updatedComment.replyCount || 0) + 1;
        
        // Update the comment in our state
        updateReply(updatedComment.id, { 
          replyCount: updatedComment.replyCount,
        });
        
        // Update view context
        setViewContext({
          ...viewContext,
          comment: updatedComment
        });
      }
      
      // If it's a thread reply, increment thread reply count for parent component
      if (parentId === null && onThreadContentUpdate && threadData) {
        const newReplyCount = (typeof threadData.replies === 'number' ? 
          threadData.replies + 1 : 
          (Array.isArray(threadData.replies) ? threadData.replies.length + 1 : 1));
        
        onThreadContentUpdate(threadData.id, { replies: newReplyCount });
      }
      
      // Clear the input
      setNewReply('');
    }
    
    setIsSubmitting(false);
  }, [threadData, viewContext, addReply, updateReply, setViewContext, onThreadContentUpdate, setNewReply]);

  // Update the deleteReply functionality to propagate the count change
  const handleReplyDelete = useCallback(async (replyId: number) => {
    // Find the reply to check if it's a thread reply
    const isThreadReply = threadData?.replies && 
      Array.isArray(threadData.replies) && 
      threadData.replies.some(r => r.id === replyId);
    
    // Call the existing delete handler
    deleteReply(replyId);
    
    // If it was a thread reply, decrement the thread's reply count
    if (isThreadReply && onThreadContentUpdate && threadData) {
      const newReplyCount = (typeof threadData.replies === 'number' ? 
        Math.max(0, threadData.replies - 1) : 
        (Array.isArray(threadData.replies) ? Math.max(0, threadData.replies.length - 1) : 0));
      
      onThreadContentUpdate(threadData.id, { replies: newReplyCount });
    }
    
    // If we're viewing comment replies, update the parent comment's reply count
    if (viewContext?.type === 'comment') {
      // Find if the deleted reply was a direct child of the current comment
      const isDirectChild = commentReplies.some(r => r.id === replyId);
      
      if (isDirectChild && viewContext.comment.replyCount > 0) {
        const updatedComment = { ...viewContext.comment };
        updatedComment.replyCount = Math.max(0, updatedComment.replyCount - 1);
        
        // Update in state
        updateReply(updatedComment.id, {
          replyCount: updatedComment.replyCount,
        });
        
        // Update view context
        setViewContext({
          ...viewContext,
          comment: updatedComment
        });
      }
    }
  }, [threadData, commentReplies, viewContext, deleteReply, updateReply, setViewContext, onThreadContentUpdate]);

  const handleThreadUpdate = useCallback(async (threadId: number, updatedData: ThreadUpdateData) => {
    if (threadData?.id !== threadId) return;
    
    updateThread(threadId, updatedData);
    
    // Propagate to parent
    if (onThreadContentUpdate) {
      onThreadContentUpdate(threadId, updatedData);
    }
  }, [threadData, updateThread, onThreadContentUpdate]);

  const handleThreadDelete = useCallback(async (threadId: number) => {
    // Close the modal
    onClose();
    
    // Propagate to parent if handler exists
    if (onThreadDelete) {
      onThreadDelete(threadId);
    }
  }, [onClose, onThreadDelete]);

  const handleReplyVoteChange = useCallback((replyId: number, upvotes: number, downvotes: number, userVote: string | null) => {
    updateReply(replyId, { 
      upvotes, 
      downvotes, 
      userVote 
    });
    
    // If this is the header comment in the current view, update view context as well
    if (viewContext?.type === 'comment' && viewContext.commentId === replyId) {
      // This ensures the header always shows current vote state
      const updatedComment = {
        ...viewContext.comment,
        upvotes,
        downvotes,
        userVote
      };
      
      // Update the view context
      setViewContext({
        ...viewContext,
        comment: updatedComment
      });
    }

    if (viewContext?.type === 'comment' && commentReplies.some(reply => reply.id === replyId)) {
      // Do nothing - maintain current view
    }
  }, [updateReply, viewContext, setViewContext, commentReplies]);

  const handleCommentVote = useCallback((voteType: 'upvote' | 'downvote') => {
    if (viewContext?.type !== 'comment' || !viewContext.comment) return;
    
    const commentId = viewContext.comment.id;
    const currentVotes = {
      upvotes: viewContext.comment.upvotes || 0,
      downvotes: viewContext.comment.downvotes || 0,
      userVote: viewContext.comment.userVote
    };
    
    // Calculate new vote values based on current state
    let newUpvotes = currentVotes.upvotes;
    let newDownvotes = currentVotes.downvotes;
    let newUserVote = voteType;
    
    // CASE 1: User clicks the same vote button they already selected (toggle off)
    if (currentVotes.userVote === voteType) {
      // Remove the vote
      if (voteType === 'upvote') newUpvotes = Math.max(0, newUpvotes - 1);
      if (voteType === 'downvote') newDownvotes = Math.max(0, newDownvotes - 1);
      newUserVote = null;
    } 
    // CASE 2: User changes their vote from one type to another
    else if (currentVotes.userVote) {
      // Remove the old vote
      if (currentVotes.userVote === 'upvote') {
        newUpvotes = Math.max(0, newUpvotes - 1);
      } else if (currentVotes.userVote === 'downvote') {
        newDownvotes = Math.max(0, newDownvotes - 1);
      }
      
      // Add the new vote
      if (voteType === 'upvote') newUpvotes++;
      if (voteType === 'downvote') newDownvotes++;
    } 
    // CASE 3: User had no vote before (adding new vote)
    else {
      // Just add the new vote
      if (voteType === 'upvote') newUpvotes++;
      if (voteType === 'downvote') newDownvotes++;
    }
    
    // Update both the reply in our central state
    updateReply(commentId, {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote
    });
    
    // CRITICAL: Also update the view context to keep header in sync
    const updatedComment = {
      ...viewContext.comment,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote
    };
    
    // This maintains our current view state with updated vote info
    setViewContext({
      ...viewContext,
      comment: updatedComment
    });
  }, [viewContext, updateReply, setViewContext]);

  const loadMoreReplies = async (contextType: 'thread' | 'comment', contextId: number, page: number) => {
    try {
      // Calculate offset based on page (0-indexed)
      const offset = (page - 1) * 10; // Assuming 10 items per page
      
      const url = contextType === 'thread' 
        ? `/api/threads/${contextId}/replies?offset=${offset}&limit=10`
        : `/api/comments/${contextId}/replies?offset=${offset}&limit=10`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${contextType} replies`);
      }
      
      const data = await response.json();
      
      // Return just the replies array for the reply-list component
      return data.replies || [];
    } catch (error) {
      console.error('Error loading more replies:', error);
      return [];
    }
  };

  // Early return if modal is not open or no thread data
  if (!isOpen || !threadData || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-start sm:items-center justify-start sm:justify-center p-0 sm:p-4">
        <div className="relative w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] mx-auto bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 sm:rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <ModalHeader 
            viewContext={viewContext} 
            navigateBack={navigateBack}
            onClose={onClose} 
          />

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Main Content (Thread or Comment) */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3 sm:p-6">
                {viewContext?.type === 'thread' ? (
                  <ThreadContent 
                    thread={threadData} 
                    onVoteChange={handleVoteChange}
                    onThreadUpdate={handleThreadUpdate}
                    onThreadDelete={handleThreadDelete}
                  />
                ) : viewContext ? (
                  <CommentContent 
                    comment={viewContext.comment} 
                    votes={{
                      upvotes: viewContext.comment.upvotes || 0,
                      downvotes: viewContext.comment.downvotes || 0,
                      userVote: viewContext.comment.userVote || null
                    }}
                    handleVote={handleCommentVote}
                    replyCount={commentReplies.length}
                    onCommentUpdate={updateReply}
                    onCommentDelete={deleteReply}
                  />
                ) : null}
              </div>

              {/* Replies Section */}
              <ReplyList
                viewContext={viewContext}
                threadReplies={Array.isArray(threadData.replies) ? threadData.replies : []}
                commentReplies={commentReplies}
                isRepliesLoading={isRepliesLoading || isLoadingCommentReplies}
                navigateToComment={navigateToComment}
                onReplyUpdate={updateReply}
                onReplyDelete={handleReplyDelete}
                onReplyVoteChange={handleReplyVoteChange}
                onLoadMoreReplies={loadMoreReplies}
              />
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
    </div>
  );
  
  return createPortal(modalContent, document.body);
};

// Update ModalHeader component
interface ModalHeaderProps {
  viewContext: ViewContext | null;
  navigateBack: () => void;
  onClose: () => void;
}

const ModalHeader = memo(({ 
  viewContext, 
  navigateBack, 
  onClose 
}: ModalHeaderProps) => (
  <div className="flex items-center justify-between p-3 sm:p-6 border-b border-white/10 flex-shrink-0 sticky top-0 bg-[#041A2E] z-10">
    <div className="flex items-center gap-2 sm:gap-3">
      {viewContext?.type === 'comment' && (
        <button 
          onClick={navigateBack} 
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-white/80" />
        </button>
      )}
      <ChatBubbleLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
      <h2 className="text-base sm:text-lg font-semibold text-white">
        {viewContext?.type === 'comment' ? 'Comment Thread' : 'Thread Discussion'}
      </h2>
    </div>
    <button
      onClick={onClose}
      className="p-1 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
      aria-label="Close"
    >
      <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
    </button>
  </div>
));

export default memo(ThreadDetailModal);