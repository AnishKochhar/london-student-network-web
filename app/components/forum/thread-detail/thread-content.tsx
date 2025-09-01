import { useState } from 'react';
import { ChatBubbleLeftIcon, ShareIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ThreadData, ThreadUpdateData } from '@/app/lib/types';
import VoteButtons from '../vote-buttons';
import { useSession } from 'next-auth/react';
import EditThreadModal from './edit-thread-modal';
import { toast } from 'react-hot-toast';
import DeleteConfirmationModal from '../delete-confirmation-modal';

interface ThreadContentProps {
  thread: ThreadData;
  onVoteChange?: (threadId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onThreadUpdate?: (threadId: number, updatedData: ThreadUpdateData) => void;
  onThreadDelete?: (threadId: number) => void; 
}

export default function ThreadContent({ thread, onVoteChange, onThreadUpdate, onThreadDelete }: ThreadContentProps) {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 
  const [isDeleting, setIsDeleting] = useState(false); 

  // Check if current user is the author
  const isAuthor = session?.user?.id === thread.authorId;

  const handleDeleteThread = async () => {
    if (!thread) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/threads/${thread.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }
      
      toast.success('Thread deleted successfully');
      
      // Call parent handler to update UI
      if (onThreadDelete) {
        onThreadDelete(thread.id);
      }
      
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  const handleUpdateThread = async (updatedData: { title: string; content: string; tags: string[] }) => {
    if (!thread) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threads/${thread.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update thread');
      }
      
      const updatedThread = await response.json();
      
      // Call the parent update handler
      if (onThreadUpdate) {
        onThreadUpdate(thread.id, {
          title: updatedData.title,
          content: updatedData.content,
          tags: updatedData.tags,
          wasEdited: updatedThread.wasEdited,
          editedTimeAgo: updatedThread.editedTimeAgo
        });
      }
      
      toast.success('Thread updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating thread:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CONTENT_CHAR_LIMIT = 300;
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const shouldTruncateContent = thread.content.length > CONTENT_CHAR_LIMIT;
  const displayContent = shouldTruncateContent && !isContentExpanded
    ? thread.content.substring(0, CONTENT_CHAR_LIMIT) + '...'
    : thread.content;

  return (
    <>
      {/* Mobile View */}
      <div className="sm:hidden">
        {/* Title and vote buttons in the same row */}
        <div className="flex gap-3 items-start mb-3">
          {/* Vote Buttons - keep horizontal */}
          <div className="flex-shrink-0">
            <VoteButtons
              itemId={thread.id}
              initialUpvotes={thread.upvotes}
              initialDownvotes={thread.downvotes}
              initialUserVote={thread.userVote}
              type="thread"
              size="medium"
              onVoteChange={onVoteChange}
            />
          </div>
          
          {/* Title with Edit/Delete buttons */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h1 className="text-xl font-bold text-white break-all overflow-hidden overflow-ellipsis">
                {thread.title}
              </h1>
              
              {isAuthor && (
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    title="Edit thread"
                    aria-label="Edit thread"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                    title="Delete thread"
                    aria-label="Delete thread"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content, tags, and meta sections */}
        <div>
          <div className="text-white/90 mb-2 leading-relaxed whitespace-pre-line text-sm break-words">
            <p>{displayContent}</p>
            
            {shouldTruncateContent && (
              <button 
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm mt-1 flex items-center gap-1"
              >
                {isContentExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
          
          {thread.wasEdited && (
            <p className="text-xs text-white/50 italic mb-3">
              Edited {thread.editedTimeAgo}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-600/30 border border-blue-400/30 rounded-full text-xs text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {thread.avatar}
              </div>
              <span className="truncate max-w-[120px]">Posted by {thread.author}</span>
              <span>•</span>
              <span>{thread.timeAgo}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 transition-colors">
                <ShareIcon className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/60">
                    {thread.totalReplies !== undefined 
                      ? thread.totalReplies 
                      : (typeof thread.replies === 'number' 
                        ? thread.replies 
                        : (Array.isArray(thread.replies) ? thread.replies.length : 0))}
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View - unchanged */}
      <div className="hidden sm:flex sm:flex-row gap-4">
        {/* Vote Section */}
        <div className="block min-w-[60px]">
          <VoteButtons
            itemId={thread.id}
            initialUpvotes={thread.upvotes}
            initialDownvotes={thread.downvotes}
            initialUserVote={thread.userVote}
            type="thread"
            size="medium"
            onVoteChange={onVoteChange}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold text-white break-all overflow-hidden overflow-ellipsis">
              {thread.title}
            </h1>
            
            {isAuthor && (
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                  title="Edit thread"
                  aria-label="Edit thread"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                  title="Delete thread"
                  aria-label="Delete thread"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          <p className="text-white/90 mb-2 leading-relaxed whitespace-pre-line text-base break-all">
            {displayContent}
          </p>
          
          {/* Edited indicator */}
          {thread.wasEdited && (
            <p className="text-sm text-white/50 italic mb-4">
              Edited {thread.editedTimeAgo}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-600/30 border border-blue-400/30 rounded-full text-sm text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Thread Meta */}
          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {thread.avatar}
                </div>
                <span className="max-w-none">Posted by {thread.author}</span>
                <span>•</span>
                <span>{thread.timeAgo}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/5 transition-colors">
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
              <div className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-4 h-4 text-white/60" />
                <span className="text-white/60">
                  {thread.totalReplies !== undefined 
                    ? thread.totalReplies 
                    : (typeof thread.replies === 'number' 
                      ? thread.replies 
                      : (Array.isArray(thread.replies) ? thread.replies.length : 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit/Delete Modals */}
      <EditThreadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateThread}
        initialData={{
          id: thread.id,
          title: thread.title,
          content: thread.content,
          tags: thread.tags
        }}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteThread}
        itemType="thread"
        isDeleting={isDeleting}
      />
    </>
  );
}