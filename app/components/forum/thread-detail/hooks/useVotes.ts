import { useState, useCallback } from 'react';
import * as threadService from '@/app/lib/services/thread-service';

interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: string | null;
}

export function useVote(
  initialUpvotes: number, 
  initialDownvotes: number, 
  initialUserVote: string | null,
  itemId: number,
  voteType: 'thread' | 'reply',
  onVoteChange?: (itemId: number, upvotes: number, downvotes: number, userVote: string | null) => void
) {
  const [votes, setVotes] = useState<VoteState>({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    userVote: initialUserVote
  });
  
  const handleVote = useCallback(async (type: 'upvote' | 'downvote') => {
    // Determine if this is removing an existing vote
    const isRemovingVote = votes.userVote === type;
    
    // Calculate new vote state optimistically
    const newVotes = { ...votes };
    
    if (isRemovingVote) {
      // User is un-voting
      newVotes[`${type}s`]--;
      newVotes.userVote = null;
    } else {
      // User is voting or changing vote
      if (votes.userVote) {
        // Remove previous vote first
        newVotes[`${votes.userVote}s`]--;
      }
      
      // Add new vote
      newVotes[`${type}s`]++;
      newVotes.userVote = type;
    }
    
    // Update UI immediately
    setVotes(newVotes);
    
    // Call parent handler if provided
    if (onVoteChange) {
      onVoteChange(itemId, newVotes.upvotes, newVotes.downvotes, newVotes.userVote);
    }
    
    // Call API
    let success;
    if (voteType === 'thread') {
      success = await threadService.submitThreadVote(itemId, type, isRemovingVote);
    } else {
      success = await threadService.submitReplyVote(itemId, type, isRemovingVote);
    }
    
    // Revert on failure
    if (!success) {
      setVotes(votes);
      if (onVoteChange) {
        onVoteChange(itemId, votes.upvotes, votes.downvotes, votes.userVote);
      }
    }
  }, [votes, itemId, voteType, onVoteChange]);

  return {
    votes,
    handleVote
  };
}