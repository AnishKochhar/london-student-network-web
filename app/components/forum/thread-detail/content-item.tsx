'use client';

import { useState } from 'react';
import { ChatBubbleLeftIcon, PencilIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Reply, CommentUpdateData, ThreadData, ThreadUpdateData } from '@/app/lib/types';
import VoteButtons from '../vote-buttons';
import { useSession } from 'next-auth/react';
import EditCommentModal from '../edit-comment-modal';
import EditThreadModal from './edit-thread-modal';
import DeleteConfirmationModal from '../delete-confirmation-modal';
import * as threadService from '@/app/lib/services/thread-service';

interface ContentItemProps {
  item: Reply | ThreadData;
  type: 'thread' | 'comment' | 'reply';
  onViewReplies?: () => void;
  replyCount?: number;
  onVoteChange?: (itemId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onItemUpdate?: (itemId: number, updatedData: CommentUpdateData | ThreadUpdateData) => void;
  onItemDelete?: (itemId: number) => void;
}

export default function ContentItem({ 
  item, 
  type,
  onViewReplies, 
  replyCount = 0,
  onVoteChange, 
  onItemUpdate, 
  onItemDelete 
}: ContentItemProps) {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if current user is the author
  const isAuthor = session?.user?.id === item.authorId;
  
  const handleDelete = async () => {
    if (!item) return;
    
    setIsDeleting(true);
    try {
      let success = false;
      
      if (type === 'thread') {
        success = await threadService.deleteThread(item.id);
      } else {
        success = await threadService.deleteComment(item.id);
      }
      
      if (success && onItemDelete) {
        onItemDelete(item.id);
      }
      
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateComment = async (updatedData: { content: string }) => {
    if (!item) return;
    
    setIsSubmitting(true);
    try {
      const updatedItem = await threadService.updateComment(item.id, updatedData.content);
      
      if (updatedItem && onItemUpdate) {
        onItemUpdate(item.id, {
          content: updatedData.content,
          wasEdited: updatedItem.wasEdited,
          editedTimeAgo: updatedItem.editedTimeAgo
        });
      }
      
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateThread = async (updatedData: { title: string; content: string; tags: string[] }) => {
    if (!item || type !== 'thread') return;
    
    const thread = item as ThreadData;
    
    setIsSubmitting(true);
    try {
      const updatedThread = await threadService.updateThread(thread.id, updatedData);
      
      if (updatedThread && onItemUpdate) {
        onItemUpdate(thread.id, {
          title: updatedData.title,
          content: updatedData.content,
          tags: updatedData.tags,
          wasEdited: updatedThread.wasEdited,
          editedTimeAgo: updatedThread.editedTimeAgo
        });
      }
      
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Set content character limit based on item type
  const CONTENT_CHAR_LIMIT = type === 'thread' ? 300 : type === 'comment' ? 200 : 150;
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const shouldTruncateContent = item.content.length > CONTENT_CHAR_LIMIT;
  const displayContent = shouldTruncateContent && !isContentExpanded
    ? item.content.substring(0, CONTENT_CHAR_LIMIT) + '...'
    : item.content;

  // For thread-specific rendering
  if (type === 'thread') {
    const thread = item as ThreadData;
    const replyCount = thread.totalReplies !== undefined 
      ? thread.totalReplies 
      : (typeof thread.replies === 'number' 
        ? thread.replies 
        : (Array.isArray(thread.replies) ? thread.replies.length : 0));

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
                  <span className="text-white/60">{replyCount}</span>
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
                  <span className="text-white/60">{replyCount}</span>
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
          onConfirm={handleDelete}
          itemType={type}
          isDeleting={isDeleting}
        />
      </>
    );
  }
  else if (type === 'reply') {
    return (
      <>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3 sm:p-4 ml-4 sm:ml-8">
          <div className="flex gap-2 sm:gap-3">
            {/* Mini Vote Section */}
            <div className="min-w-[36px] sm:min-w-[40px]">
              <VoteButtons
                itemId={item.id}
                initialUpvotes={item.upvotes}
                initialDownvotes={item.downvotes}
                initialUserVote={item.userVote}
                type="reply"
                size="small"
                onVoteChange={onVoteChange}
              />
            </div>

            {/* Reply Content */}
            <div className="flex-1">
              {/* Author info */}
              <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {item.avatar}
                  </div>
                  <span className="font-medium text-white/90 text-xs sm:text-sm overflow-hidden text-ellipsis max-w-[100px]">
                    {item.author}
                  </span>
                  <span className="text-white/60 text-xs sm:text-sm">•</span>
                  <span className="text-white/60 text-xs sm:text-sm">{item.timeAgo}</span>
                </div>
                
                {isAuthor && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-0.5 sm:p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                      title={`Edit ${type}`}
                      aria-label={`Edit ${type}`}
                    >
                      <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-0.5 sm:p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                      title={`Delete ${type}`}
                      aria-label={`Delete ${type}`}
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
                {item.wasEdited && (
                  <p className="text-xs text-white/50 italic mb-1.5 sm:mb-2">
                    Edited {item.editedTimeAgo}
                  </p>
                )}
              </div>

              {onViewReplies && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={onViewReplies}
                    className="text-white/60 hover:text-white/80 text-xs sm:text-sm transition-colors flex items-center gap-1"
                  >
                    <ChatBubbleLeftIcon className="w-3 h-3" />
                    {item.replyCount > 0 ? (
                      <span>Reply ({item.replyCount})</span>
                    ) : (
                      <span>Reply</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <EditCommentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateComment}
          initialData={{
            id: item.id,
            content: item.content
          }}
          isSubmitting={isSubmitting}
        />
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemType={type}
          isDeleting={isDeleting}
        />
      </>
    );
  } else {
    // Comment layout - has mobile and desktop versions
    return (
      <>
        {/* Mobile View */}
        <div className="sm:hidden">
          {/* Vote buttons on left, all content on right */}
          <div className="flex gap-3 items-start">
            {/* Vote Buttons - keep horizontal */}
            <div className="flex-shrink-0">
              <VoteButtons
                itemId={item.id}
                initialUpvotes={item.upvotes}
                initialDownvotes={item.downvotes}
                initialUserVote={item.userVote}
                type="reply"
                size="medium"
                onVoteChange={onVoteChange}
              />
            </div>
            
            {/* Right column with author info and content */}
            <div className="flex-1 flex flex-col">
              {/* Author info and controls */}
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {item.avatar}
                  </div>
                  <span className="font-medium text-white text-sm overflow-hidden text-ellipsis max-w-[100px]">
                    {item.author}
                  </span>
                  <span className="text-white/60 text-sm">•</span>
                  <span className="text-white/60 text-xs">{item.timeAgo}</span>
                </div>
                
                {isAuthor && (
                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                      title={`Edit ${type}`}
                      aria-label={`Edit ${type}`}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                      title={`Delete ${type}`}
                      aria-label={`Delete ${type}`}
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
                {item.wasEdited && (
                  <p className="text-xs text-white/50 italic mb-1">
                    Edited {item.editedTimeAgo}
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

        {/* Desktop View */}
        <div className="hidden sm:flex sm:flex-row sm:gap-4">
          {/* Vote Section */}
          <div className="block min-w-[60px]">
            <VoteButtons
              itemId={item.id}
              initialUpvotes={item.upvotes}
              initialDownvotes={item.downvotes}
              initialUserVote={item.userVote}
              type="reply"
              size="medium"
              onVoteChange={onVoteChange}
            />
          </div>

          {/* Content Section */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.avatar}
                </div>
                <span className="font-medium text-white text-base">{item.author}</span>
                <span className="text-white/60 text-base">•</span>
                <span className="text-white/60 text-sm">{item.timeAgo}</span>
              </div>
              
              {isAuthor && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    title={`Edit ${type}`}
                    aria-label={`Edit ${type}`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-red-400"
                    title={`Delete ${type}`}
                    aria-label={`Delete ${type}`}
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
              {item.wasEdited && (
                <p className="text-sm text-white/50 italic">
                  Edited {item.editedTimeAgo}
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
            id: item.id,
            content: item.content
          }}
          isSubmitting={isSubmitting}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemType={type}
          isDeleting={isDeleting}
        />
      </>
    );
  }
}