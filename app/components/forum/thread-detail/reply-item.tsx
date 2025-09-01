import { useState } from 'react';
import { ChatBubbleLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Reply, CommentUpdateData } from '@/app/lib/types';
import VoteButtons from '../vote-buttons';
import { useSession } from 'next-auth/react';
import EditCommentModal from '../edit-comment-modal';
import DeleteConfirmationModal from '../delete-confirmation-modal';
import { toast } from 'react-hot-toast';

interface ReplyItemProps {
  reply: Reply;
  onViewReplies: () => void;
  onVoteChange?: (replyId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onReplyUpdate?: (replyId: number, updatedData: CommentUpdateData) => void;
  onReplyDelete?: (replyId: number) => void; 
}

export default function ReplyItem({ reply, onViewReplies, onVoteChange, onReplyUpdate, onReplyDelete }: ReplyItemProps) {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  
  // Check if current user is the author
  const isAuthor = session?.user?.id === reply.authorId;
  
  const handleDeleteReply = async () => {
    if (!reply) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${reply.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }
      
      toast.success('Reply deleted successfully');
      
      // Call parent handler to update UI
      if (onReplyDelete) {
        onReplyDelete(reply.id);
      }
      
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdateReply = async (updatedData: { content: string }) => {
    if (!reply) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${reply.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reply');
      }
      
      const updatedReply = await response.json();
      
      // Call the parent update handler
      if (onReplyUpdate) {
        onReplyUpdate(reply.id, {
          ...reply,
          content: updatedData.content,
          wasEdited: updatedReply.wasEdited,
          editedTimeAgo: updatedReply.editedTimeAgo
        });
      }
      
      toast.success('Reply updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const CONTENT_CHAR_LIMIT = 150;
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const shouldTruncateContent = reply.content.length > CONTENT_CHAR_LIMIT;
  const displayContent = shouldTruncateContent && !isContentExpanded
    ? reply.content.substring(0, CONTENT_CHAR_LIMIT) + '...'
    : reply.content;

  return (
    <>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3 sm:p-4 ml-4 sm:ml-8">
        <div className="flex gap-2 sm:gap-3">
          {/* Mini Vote Section */}
          <div className="min-w-[36px] sm:min-w-[40px]">
            <VoteButtons
              itemId={reply.id}
              initialUpvotes={reply.upvotes}
              initialDownvotes={reply.downvotes}
              initialUserVote={reply.userVote}
              type="reply"
              size="small"
              onVoteChange={(replyId, upvotes, downvotes, userVote) => {
                // Call the parent handler if provided
                if (onVoteChange) {
                  onVoteChange(replyId, upvotes, downvotes, userVote);
                }
              }}
            />
          </div>

          {/* Reply Content */}
          <div className="flex-1">
            {/* Author info */}
            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {reply.avatar}
                </div>
                <span className="font-medium text-white/90 text-xs sm:text-sm overflow-hidden text-ellipsis max-w-[100px]">
                  {reply.author}
                </span>
                <span className="text-white/60 text-xs sm:text-sm">•</span>
                <span className="text-white/60 text-xs sm:text-sm">{reply.timeAgo}</span>
              </div>
              
              {isAuthor && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-0.5 sm:p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    title="Edit reply"
                    aria-label="Edit reply"
                  >
                    <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-0.5 sm:p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                    title="Delete reply"
                    aria-label="Delete reply"
                  >
                    <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-white/80 mb-1.5 sm:mb-2 leading-relaxed whitespace-pre-line text-xs sm:text-sm break-all">
                {displayContent}
              </p>
              
              {shouldTruncateContent && (
                <button 
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-xs mb-1.5 sm:mb-2 flex items-center gap-1"
                >
                  {isContentExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
              
              {/* Edited indicator */}
              {reply.wasEdited && (
                <p className="text-xs text-white/50 italic mb-1.5 sm:mb-2">
                  Edited {reply.editedTimeAgo}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onViewReplies}
                className="text-white/60 hover:text-white/80 text-xs sm:text-sm transition-colors flex items-center gap-1"
              >
                <ChatBubbleLeftIcon className="w-3 h-3" />
                {reply.replyCount > 0 ? (
                  <span>Reply ({reply.replyCount})</span>
                ) : (
                  <span>Reply</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      
      {/* Edit Modal */}
      <EditCommentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateReply}
        initialData={{
          id: reply.id,
          content: reply.content
        }}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteReply}
        itemType="reply"
        isDeleting={isDeleting}
      />
    </>
  );
}