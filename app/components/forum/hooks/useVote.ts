'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import * as threadService from '@/app/lib/services/thread-service';

interface UseVoteProps {
  itemId: number;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: string | null;
  type: 'thread' | 'reply';
  onVoteChange?: (itemId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
}

export function useVote({
  itemId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  type,
  onVoteChange
}: UseVoteProps) {
  const { data: session } = useSession();
  const [votes, setVotes] = useState({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    userVote: initialUserVote
  });
  const [isVoting, setIsVoting] = useState(false);

  // Update local state if props change
  useEffect(() => {
    setVotes({
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: initialUserVote
    });
  }, [initialUpvotes, initialDownvotes, initialUserVote]);

  // Calculate the score
  const voteScore = votes.upvotes - votes.downvotes;

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!session?.user) {
      toast.error('You must be logged in to vote', { duration: 3000 });
      return;
    }

    if (isVoting) return;

    try {
      setIsVoting(true);
      const isRemovingVote = votes.userVote === voteType;
      const newVotes = { ...votes };

      if (newVotes.userVote === voteType) {
        // User is un-voting
        newVotes.userVote = null;
        newVotes[`${voteType}s`] = newVotes[`${voteType}s`] - 1;
      } else {
        // User is voting or changing vote
        if (newVotes.userVote) {
          // Remove previous vote first
          newVotes[`${newVotes.userVote}s`] = newVotes[`${newVotes.userVote}s`] - 1;
        }

        // Add new vote
        newVotes.userVote = voteType;
        newVotes[`${voteType}s`] = newVotes[`${voteType}s`] + 1;
      }

      // Update local state first (optimistically)
      setVotes(newVotes);

      // Call the onVoteChange callback if provided
      if (onVoteChange) {
        onVoteChange(itemId, newVotes.upvotes, newVotes.downvotes, newVotes.userVote);
      }

      // Submit vote using thread service
      const success = type === 'thread'
        ? await threadService.submitThreadVote(itemId, voteType, isRemovingVote)
        : await threadService.submitReplyVote(itemId, voteType, isRemovingVote);
      
      if (!success) {
        throw new Error('Failed to register vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert to original state on error
      setVotes({
        upvotes: initialUpvotes,
        downvotes: initialDownvotes,
        userVote: initialUserVote
      });

      // Also revert in parent component if callback provided
      if (onVoteChange) {
        onVoteChange(itemId, initialUpvotes, initialDownvotes, initialUserVote);
      }

      toast.error('Failed to register vote. Please try again.', { duration: 4000 });
    } finally {
      setIsVoting(false);
    }
  };

  return { votes, voteScore, isVoting, handleVote };
}