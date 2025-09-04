import { memo, useCallback} from 'react';
import { Reply, CommentUpdateData } from '@/app/lib/types';
import ContentItem from './content-item';

interface CommentContentProps {
  comment: Reply;
  votes?: {
    upvotes: number;
    downvotes: number;
    userVote: string | null;
  };
  handleVote?: (voteType: 'upvote' | 'downvote') => void;
  replyCount?: number;
  onCommentUpdate?: (commentId: number, updatedData: CommentUpdateData) => void;
  onCommentDelete?: (commentId: number) => void;
}

function CommentContent({ 
  comment, 
  votes = { upvotes: comment.upvotes || 0, downvotes: comment.downvotes || 0, userVote: comment.userVote || null }, 
  handleVote = () => {}, 
  replyCount = 0, 
  onCommentUpdate, 
  onCommentDelete 
}: CommentContentProps) {
  // Handle vote changes from VoteButtons component
  const handleVoteChange = (itemId: number, upvotes: number, downvotes: number, userVote: string | null) => {
    if (userVote !== votes.userVote) {
      handleVote(userVote as 'upvote' | 'downvote');
    }
  };

  const handleItemUpdate = useCallback((itemId: number, updatedData: CommentUpdateData) => {
    if (onCommentUpdate) {
      onCommentUpdate(itemId, updatedData);
    }
  }, [onCommentUpdate]);

  const handleItemDelete = useCallback((itemId: number) => {
    if (onCommentDelete) {
      onCommentDelete(itemId);
    }
  }, [onCommentDelete]);
  
  // Create a merged comment object with the external votes if provided
  const commentWithVotes = {
    ...comment,
    upvotes: votes.upvotes,
    downvotes: votes.downvotes,
    userVote: votes.userVote
  };

  return (
    <ContentItem
      item={commentWithVotes}
      type="comment"
      replyCount={replyCount}
      onVoteChange={handleVoteChange}
      onItemUpdate={handleItemUpdate}
      onItemDelete={handleItemDelete}
    />
  );
}

export default memo(CommentContent);