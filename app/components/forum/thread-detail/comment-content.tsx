import { useState, memo } from 'react';
import { Reply, CommentUpdateData } from '@/app/lib/types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import EditCommentModal from '../edit-comment-modal';
import { toast } from 'react-hot-toast';
import VoteButtons from '../vote-buttons';
import DeleteConfirmationModal from '../delete-confirmation-modal';

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
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  
  // Check if current user is the author
  const isAuthor = session?.user?.id === comment.authorId;
  
  const handleDeleteComment = async () => {
    if (!comment) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      toast.success('Comment deleted successfully');
      
      // Call parent handler to update UI
      if (onCommentDelete) {
        onCommentDelete(comment.id);
      }
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdateComment = async (updatedData: { content: string }) => {
    if (!comment) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update comment');
      }
      
      const updatedComment = await response.json();
      
      // Call the parent update handler
      if (onCommentUpdate) {
        onCommentUpdate(comment.id, {
          ...comment,
          content: updatedData.content,
          wasEdited: updatedComment.wasEdited,
          editedTimeAgo: updatedComment.editedTimeAgo
        });
      }
      
      toast.success('Comment updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle vote changes from VoteButtons component
  const handleVoteChange = (itemId: number, upvotes: number, downvotes: number, userVote: string | null) => {
    // The parent component expects a simpler handleVote function that just takes the vote type
    // So we need to adapt between the two interfaces
    if (userVote !== votes.userVote) {
      handleVote(userVote as 'upvote' | 'downvote');
    }
  };

  const CONTENT_CHAR_LIMIT = 200;
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const shouldTruncateContent = comment.content.length > CONTENT_CHAR_LIMIT;
  const displayContent = shouldTruncateContent && !isContentExpanded
    ? comment.content.substring(0, CONTENT_CHAR_LIMIT) + '...'
    : comment.content;

  return (
    <>
      {/* Mobile View */}
      <div className="sm:hidden">
        {/* Vote buttons on left, all content on right */}
        <div className="flex gap-3 items-start">
          {/* Vote Buttons - keep horizontal */}
          <div className="flex-shrink-0">
            <VoteButtons
              itemId={comment.id}
              initialUpvotes={votes.upvotes}
              initialDownvotes={votes.downvotes}
              initialUserVote={votes.userVote}
              type="reply"
              size="medium"
              onVoteChange={handleVoteChange}
            />
          </div>
          
          {/* Right column with author info and content */}
          <div className="flex-1 flex flex-col">
            {/* Author info and controls */}
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {comment.avatar}
                </div>
                <span className="font-medium text-white text-sm overflow-hidden text-ellipsis max-w-[100px]">
                  {comment.author}
                </span>
                <span className="text-white/60 text-sm">•</span>
                <span className="text-white/60 text-xs">{comment.timeAgo}</span>
              </div>
              
              {isAuthor && (
                <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    title="Edit comment"
                    aria-label="Edit comment"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                    title="Delete comment"
                    aria-label="Delete comment"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Comment content */}
            <div>
              <p className="text-white/90 mb-1.5 whitespace-pre-line leading-relaxed text-sm break-all">
                {displayContent}
              </p>
              
              {shouldTruncateContent && (
                <button 
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-xs mb-1.5 flex items-center gap-1"
                >
                  {isContentExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
              
              {/* Edited indicator */}
              {comment.wasEdited && (
                <p className="text-xs text-white/50 italic mb-1">
                  Edited {comment.editedTimeAgo}
                </p>
              )}
            </div>
            
            {/* Reply count */}
            <div className="text-white/70 text-xs mt-1">
              <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View - unchanged */}
      <div className="hidden sm:flex sm:flex-row sm:gap-4">
        {/* Vote Section */}
        <div className="block min-w-[60px]">
          <VoteButtons
            itemId={comment.id}
            initialUpvotes={votes.upvotes}
            initialDownvotes={votes.downvotes}
            initialUserVote={votes.userVote}
            type="reply"
            size="medium"
            onVoteChange={handleVoteChange}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                {comment.avatar}
              </div>
              <span className="font-medium text-white text-base">{comment.author}</span>
              <span className="text-white/60 text-base">•</span>
              <span className="text-white/60 text-sm">{comment.timeAgo}</span>
            </div>
            
            {isAuthor && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                  title="Edit comment"
                  aria-label="Edit comment"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <p className="text-white/90 mb-2 whitespace-pre-line leading-relaxed text-base break-all">
              {displayContent}
            </p>
            
            {/* Edited indicator */}
            {comment.wasEdited && (
              <p className="text-sm text-white/50 italic">
                Edited {comment.editedTimeAgo}
              </p>
            )}
          </div>
          
          <div className="text-white/70 text-sm">
            <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        </div>
      </div>
      
      {/* Edit/Delete Modals */}
      <EditCommentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateComment}
        initialData={{
          id: comment.id,
          content: comment.content
        }}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteComment}
        itemType="comment"
        isDeleting={isDeleting}
      />
    </>
  );
}

export default memo(CommentContent);