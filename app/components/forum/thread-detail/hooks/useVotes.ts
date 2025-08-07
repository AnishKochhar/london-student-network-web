import { useState, useEffect } from 'react';
import { ThreadData } from '@/app/lib/types';

export function useVotes(thread: ThreadData | null) {
  const [threadVotes, setThreadVotes] = useState({
    upvotes: thread?.upvotes || 0,
    downvotes: thread?.downvotes || 0,
    userVote: thread?.userVote || null
  });
  
  const [replyVotes, setReplyVotes] = useState<Record<number, {
    upvotes: number;
    downvotes: number;
    userVote: string | null;
  }>>({});

  // Update votes state when thread changes
  useEffect(() => {
    if (thread) {
      setThreadVotes({
        upvotes: thread.upvotes,
        downvotes: thread.downvotes,
        userVote: thread.userVote
      });
      
      // Initialize reply votes if we have replies
      if (Array.isArray(thread.replies) && thread.replies.length) {
        const initialReplyVotes = thread.replies.reduce((acc, reply) => {
          acc[reply.id] = {
            upvotes: reply.upvotes,
            downvotes: reply.downvotes,
            userVote: reply.userVote || null
          };
          return acc;
        }, {} as Record<number, { upvotes: number; downvotes: number; userVote: string | null; }>);
        
        setReplyVotes(initialReplyVotes);
      }
    }
  }, [thread]);

  const handleThreadVote = async (voteType: 'upvote' | 'downvote') => {
    if (!thread) return;
    
    // Determine if this is a new vote or removing an existing vote
    const isRemovingVote = threadVotes.userVote === voteType;
    
    // Optimistically update UI
    setThreadVotes(prev => {
      const newState = { ...prev };
      
      if (prev.userVote === voteType) {
        // User is un-voting
        newState.userVote = null;
        newState[`${voteType}s`] = prev[`${voteType}s`] - 1;
      } else {
        // User is voting or changing vote
        if (prev.userVote) {
          // Remove previous vote first
          newState[`${prev.userVote}s`] = prev[`${prev.userVote}s`] - 1;
        }
        
        // Add new vote
        newState.userVote = voteType;
        newState[`${voteType}s`] = prev[`${voteType}s`] + 1;
      }
      
      return newState;
    });
    
    try {
      // Make API call to record vote
      const response = await fetch('/api/threads/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: thread.id,
          voteType: voteType,
          action: isRemovingVote ? 'remove' : 'add'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to register vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on error
      if (thread) {
        setThreadVotes({
          upvotes: thread.upvotes,
          downvotes: thread.downvotes,
          userVote: thread.userVote
        });
      }
    }
  };

  const handleReplyVote = async (replyId: number, voteType: 'upvote' | 'downvote') => {
    if (!thread) return;
    const current = replyVotes[replyId];
    if (!current) return;
    
    // Determine if this is a new vote or removing an existing vote
    const isRemovingVote = current.userVote === voteType;
    
    // Optimistically update UI
    setReplyVotes(prev => {
      const newState = { ...prev };
      const currentVote = { ...prev[replyId] };
      
      if (currentVote.userVote === voteType) {
        // User is un-voting
        currentVote.userVote = null;
        currentVote[`${voteType}s`] = currentVote[`${voteType}s`] - 1;
      } else {
        // User is voting or changing vote
        if (currentVote.userVote) {
          // Remove previous vote first
          currentVote[`${currentVote.userVote}s`] = currentVote[`${currentVote.userVote}s`] - 1;
        }
        
        // Add new vote
        currentVote.userVote = voteType;
        currentVote[`${voteType}s`] = currentVote[`${voteType}s`] + 1;
      }
      
      newState[replyId] = currentVote;
      return newState;
    });
    
    try {
      // Make API call to record vote
      const response = await fetch('/api/replies/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyId,
          voteType,
          action: isRemovingVote ? 'remove' : 'add'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to register vote');
      }
    } catch (error) {
      console.error('Error voting on reply:', error);
      // Handle error recovery
    }
  };

  return { threadVotes, replyVotes, handleThreadVote, handleReplyVote, setReplyVotes };
}