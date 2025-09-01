import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Reply, ViewContext } from '@/app/lib/types';
import ReplyItem from './reply-item';

interface ReplyListProps {
  viewContext: ViewContext | null;
  threadReplies: Reply[];
  commentReplies: Reply[];
  isRepliesLoading: boolean;
  navigateToComment: (comment: Reply) => void;
  onReplyUpdate: (replyId: number, data: Partial<Reply>) => void;
  onReplyDelete: (replyId: number) => void;
  onReplyVoteChange?: (replyId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onLoadMoreReplies?: (contextType: 'thread' | 'comment', contextId: number, page: number) => Promise<Reply[]>;
}

// Constants for pagination
const DISPLAY_BATCH_SIZE = 5;  // Show 5 replies at a time
const FETCH_BATCH_SIZE = 10;   // Fetch 10 at once for efficiency

const ReplyList = ({ 
  viewContext,
  threadReplies,
  commentReplies,
  isRepliesLoading,
  navigateToComment,
  onReplyUpdate,
  onReplyDelete,
  onReplyVoteChange,
  onLoadMoreReplies
}: ReplyListProps) => {
  // Determine which replies to show based on context
  const allReplies = viewContext?.type === 'comment' ? commentReplies : threadReplies;
  const listTitle = viewContext?.type === 'comment' ? 'Replies to this comment' : 'Replies';
  
  // State for displayed replies and pagination
  const [displayedReplies, setDisplayedReplies] = useState<Reply[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const availableRepliesRef = useRef<Reply[]>([]); // Store pre-fetched replies
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Reset pagination when context or source replies change
  useEffect(() => {
    setDisplayedReplies([]);
    setPage(1);
    setHasMoreReplies(true);
    availableRepliesRef.current = [];
    
    // Show initial batch if replies are available
    if (allReplies.length > 0) {
      availableRepliesRef.current = [...allReplies];
      setDisplayedReplies(allReplies.slice(0, DISPLAY_BATCH_SIZE));
      
      // If there are more replies to show, keep hasMoreReplies true
      setHasMoreReplies(allReplies.length > DISPLAY_BATCH_SIZE);
    }
  }, [viewContext?.type, commentReplies, threadReplies]);

  // Function to fetch more replies from API
  const fetchMoreFromApi = useCallback(async () => {
    if (!viewContext || !onLoadMoreReplies || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const contextId = viewContext.type === 'comment' ? viewContext.comment.id : viewContext.threadId;
      const contextType = viewContext.type;
      
      // Fetch the next page of replies
      const newReplies = await onLoadMoreReplies(contextType, contextId, page + 1);
      
      if (newReplies.length > 0) {
        // Add new replies to our available pool
        availableRepliesRef.current = [...availableRepliesRef.current, ...newReplies];
        
        // Show the next batch of replies
        const nextBatch = newReplies.slice(0, DISPLAY_BATCH_SIZE);
        
        setDisplayedReplies(prev => [...prev, ...nextBatch]);
        setPage(prev => prev + 1);
        
        // If we got fewer replies than requested, we've reached the end
        setHasMoreReplies(newReplies.length >= FETCH_BATCH_SIZE);
      } else {
        // No more replies
        setHasMoreReplies(false);
      }
    } catch (error) {
      console.error('Error loading more replies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [displayedReplies.length, isLoadingMore, onLoadMoreReplies, page, viewContext]);

  // Function to load more replies
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isRepliesLoading || !hasMoreReplies || !viewContext) {
      return;
    }
    
    const currentDisplayCount = displayedReplies.length;
    const availableReplies = availableRepliesRef.current;
    
    // If we have more pre-fetched replies that aren't displayed yet, show the next batch
    if (availableReplies.length > currentDisplayCount) {
      const nextBatch = availableReplies.slice(
        currentDisplayCount, 
        currentDisplayCount + DISPLAY_BATCH_SIZE
      );
      
      setDisplayedReplies(prev => [...prev, ...nextBatch]);
      
      // If we've used most of our pre-fetched replies, fetch more in the background
      const remainingReplies = availableReplies.length - (currentDisplayCount + DISPLAY_BATCH_SIZE);
      if (remainingReplies < DISPLAY_BATCH_SIZE && onLoadMoreReplies && hasMoreReplies) {
        fetchMoreFromApi();
      }
      
      return;
    }
    
    // If we don't have more pre-fetched replies, fetch from API
    if (onLoadMoreReplies && hasMoreReplies) {
      fetchMoreFromApi();
    } else {
      // If no API handler provided, we've shown all replies
      setHasMoreReplies(false);
    }
  }, [displayedReplies.length, fetchMoreFromApi, hasMoreReplies, isLoadingMore, isRepliesLoading, onLoadMoreReplies, viewContext]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Clean up previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          handleLoadMore();
        }
      },
      { 
        root: null,
        rootMargin: '100px',  // Start loading earlier
        threshold: 0.1 
      }
    );

    // Attach observer to the load more element
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore]);
  
  // Loading state for initial load
  if (isRepliesLoading && !displayedReplies.length) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
          {listTitle}
        </h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (allReplies.length === 0 && !isRepliesLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
          {listTitle}
        </h3>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center text-white/60">
          No replies yet. Be the first to reply!
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
        {listTitle} {displayedReplies.length > 0 && <span className="text-white/60 text-sm">({allReplies.length})</span>}
      </h3>
      
      {/* Display current batch of replies */}
      <div className="space-y-4">
        {displayedReplies.map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            onViewReplies={() => navigateToComment(reply)}
            onReplyUpdate={onReplyUpdate}
            onReplyDelete={onReplyDelete}
            onVoteChange={onReplyVoteChange}
          />
        ))}
        
        {/* Manual load more button for fallback */}
        {(hasMoreReplies || isLoadingMore) && (
          <div 
            ref={loadMoreRef} 
            className="py-4 text-center"
          >
            {isLoadingMore ? (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <button
                onClick={handleLoadMore}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Load more replies
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ReplyList);