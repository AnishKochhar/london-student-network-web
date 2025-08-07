import { useState, useEffect } from 'react';
import { Reply, ThreadData } from '@/app/lib/types';

type ViewContext = {
  type: 'thread';
  threadId: number;
} | {
  type: 'comment';
  threadId: number;
  commentId: number;
  comment: Reply;
  parentComment?: Reply;
};

export function useCommentNav(thread: ThreadData | null) {
  const [viewContext, setViewContext] = useState<ViewContext | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewContext[]>([]);

  // Initialize view context when thread changes
  useEffect(() => {
    if (thread) {
      // Reset to thread view
      setViewContext({
        type: 'thread',
        threadId: thread.id
      });
      // Clear navigation history
      setViewHistory([]);
    }
  }, [thread]);

  const navigateToComment = (comment: Reply) => {
    if (!thread) return;
    
    // Find parent comment if needed
    let parentComment;
    if (thread && Array.isArray(thread.replies)) {
      parentComment = thread.replies.find(r => r.id === comment.parent_id);
    }
    
    // Save current view to history before changing
    if (viewContext) {
      setViewHistory(prev => [...prev, viewContext]);
    }
    
    // Set the new view context
    setViewContext({
      type: 'comment',
      threadId: thread.id,
      commentId: comment.id,
      comment: comment,
      parentComment
    });
  };

  const navigateBack = () => {
    // If we have history, go back to previous view
    if (viewHistory.length > 0) {
      // Get the last item from history
      const previousView = viewHistory[viewHistory.length - 1];
      
      // Remove it from history
      setViewHistory(prev => prev.slice(0, prev.length - 1));
      
      // Set it as the current view
      setViewContext(previousView);
    } else if (thread) {
      // No history, go back to thread view
      setViewContext({
        type: 'thread',
        threadId: thread.id
      });
    }
  };

  return { viewContext, viewHistory, setViewContext, navigateToComment, navigateBack };
}