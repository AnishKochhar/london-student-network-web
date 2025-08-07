import { useState } from 'react';
import { Reply, ThreadData } from '@/app/lib/types';

interface UseRepliesProps {
  thread: ThreadData | null;
  viewContext: any; // Using any here for simplicity
  setIsLoadingCommentReplies: (isLoading: boolean) => void;
  setNewReply: (reply: string) => void;
}

export function useReplies({ 
  thread, 
  viewContext, 
  setIsLoadingCommentReplies, 
  setNewReply 
}: UseRepliesProps) {
  const [commentReplies, setCommentReplies] = useState<Reply[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to fetch replies to a specific comment
  const fetchCommentReplies = async (commentId: number) => {
    setIsLoadingCommentReplies(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/replies`);
      if (!response.ok) {
        throw new Error('Failed to fetch comment replies');
      }
      const replies = await response.json();
      setCommentReplies(replies);
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      setCommentReplies([]);
    } finally {
      setIsLoadingCommentReplies(false);
    }
  };

  const handleSubmitReply = async (replyContent: string) => {
    if (!thread || !replyContent.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Determine the parentId based on the current view context
      const parentId = viewContext?.type === 'comment' ? viewContext.commentId : null;
      
      const response = await fetch('/api/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: thread.id,
          content: replyContent,
          parentId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }
      
      // Get the newly created comment
      const newComment = await response.json();
      
      // Update the UI based on the current view context
      if (viewContext?.type === 'comment') {
        // Add to comment replies
        setCommentReplies(prev => [...prev, newComment]);
      } else if (Array.isArray(thread.replies)) {
        // Add to thread replies
        thread.replies.push(newComment);
      }
      
      // Clear the input
      setNewReply('');
      
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    commentReplies, 
    setCommentReplies,
    isSubmitting,
    fetchCommentReplies,
    handleSubmitReply
  };
}