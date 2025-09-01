'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  ArrowUpIcon as ArrowUpOutline, 
  ArrowDownIcon as ArrowDownOutline 
} from '@heroicons/react/24/outline';
import { 
  ArrowUpIcon as ArrowUpSolid, 
  ArrowDownIcon as ArrowDownSolid 
} from '@heroicons/react/24/solid';

interface VoteButtonsProps {
  itemId: number;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: string | null;
  type: 'thread' | 'reply';
  size?: 'small' | 'medium' | 'large';
  orientation?: 'vertical' | 'horizontal';
  onVoteChange?: (itemId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
}

export default function VoteButtons({
  itemId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  type,
  size = 'medium',
  orientation = 'vertical',
  onVoteChange
}: VoteButtonsProps) {
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

  // Get the score color based on the value
  const getScoreColor = () => {
    if (voteScore > 0) return 'text-green-400';
    if (voteScore < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Get the button and text sizes based on the size prop
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { icon: 'w-3 h-3', text: 'text-sm' };
      case 'large':
        return { icon: 'w-6 h-6', text: 'text-xl' };
      default:
        return { icon: 'w-5 h-5', text: 'text-lg' };
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!session?.user) {
      toast.error('You must be logged in to vote', {
        icon: '🔒',
        duration: 3000,
      });
      return;
    }

    if (isVoting) return; // Prevent multiple clicks

    try {
      setIsVoting(true);

      // Determine if this is a new vote or removing an existing vote
      const isRemovingVote = votes.userVote === voteType;

      // Calculate the new vote state
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

      // Make API call to record vote
      const endpoint = type === 'thread' ? '/api/threads/vote' : '/api/replies/vote';
      const payload = type === 'thread' 
        ? { threadId: itemId, voteType, action: isRemovingVote ? 'remove' : 'add' }
        : { replyId: itemId, voteType, action: isRemovingVote ? 'remove' : 'add' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
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

      // Replace alert with toast notification
      toast.error('Failed to register vote. Please try again.', {
        icon: '❌',
        duration: 4000,
      });
    } finally {
      setIsVoting(false);
    }
  };

  const { icon, text } = getButtonSize();

  // Rest of the component remains the same...
  if (orientation === 'horizontal') {
    // Horizontal layout code unchanged
    return (
      <div className="flex items-center gap-2">
        <button
          className={`p-1 rounded transition-colors ${
            votes.userVote === 'upvote'
              ? 'text-green-400'
              : 'hover:bg-white/10 text-white/70'
          }`}
          onClick={() => handleVote('upvote')}
          disabled={isVoting}
        >
          {votes.userVote === 'upvote' ?
            <ArrowUpSolid className={icon} /> :
            <ArrowUpOutline className={icon} />
          }
        </button>

        <span className={`font-bold ${text} ${getScoreColor()}`}>
          {voteScore}
        </span>

        <button
          className={`p-1 rounded transition-colors ${
            votes.userVote === 'downvote'
              ? 'text-red-400'
              : 'hover:bg-white/10 text-white/70'
          }`}
          onClick={() => handleVote('downvote')}
          disabled={isVoting}
        >
          {votes.userVote === 'downvote' ?
            <ArrowDownSolid className={icon} /> :
            <ArrowDownOutline className={icon} />
          }
        </button>
      </div>
    );
  }

  // Default vertical layout code unchanged
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className={`p-1 rounded transition-colors ${
          votes.userVote === 'upvote'
            ? 'text-green-400'
            : 'hover:bg-white/10 text-white/70'
        }`}
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
      >
        {votes.userVote === 'upvote' ?
          <ArrowUpSolid className={icon} /> :
          <ArrowUpOutline className={icon} />
        }
      </button>

      <span className={`font-bold ${text} ${getScoreColor()}`}>
        {voteScore}
      </span>

      <button
        className={`p-1 rounded transition-colors ${
          votes.userVote === 'downvote'
            ? 'text-red-400'
            : 'hover:bg-white/10 text-white/70'
        }`}
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
      >
        {votes.userVote === 'downvote' ?
          <ArrowDownSolid className={icon} /> :
          <ArrowDownOutline className={icon} />
        }
      </button>
    </div>
  );
}