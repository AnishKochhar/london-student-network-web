'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ForumControls from '../components/forum/forum-controls';
import PostList from '../components/forum/post-list';
import Sidebar from '../components/forum/sidebar';
import ThreadDetailModal from '../components/forum/thread-detail';
import NewThreadModal from '../components/forum/new-thread-modal';
import { ForumPost, ThreadData, ThreadUpdateData } from '../lib/types';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';



// Constants for pagination
const INITIAL_FETCH_COUNT = 6;
const LOAD_MORE_COUNT = 3;
const SEARCH_DEBOUNCE_DELAY = 500; // 500ms debounce delay

export default function ForumPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRepliesLoading, setIsRepliesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search term changes
  useEffect(() => {
    // Clear the previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_DELAY);
    
    // Cleanup function to clear timeout if component unmounts or searchTerm changes again
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchThreads();
  }, []);

  // Reset and fetch new data when debounced search or sort changes
  useEffect(() => {
    if (page === 1) {
      fetchThreads();
    } else {
      setPage(1); // This will trigger the next useEffect
      setPosts([]);
    }
  }, [debouncedSearchTerm, sortBy]);

  // Fetch data when page changes (except the first page which is handled above)
  useEffect(() => {
    if (page > 1) {
      fetchMoreThreads();
    }
  }, [page]);
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMorePosts && !isLoadingMore && !isLoading) {
          loadMorePosts();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Load more content before reaching the end
      }
    );
    
    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMorePosts, isLoadingMore, isLoading]);
  
  // Function to load more posts
  const loadMorePosts = () => {
    if (!isLoadingMore && hasMorePosts) {
      setPage(prevPage => prevPage + 1);
    }
  };
  
  // Fetch initial threads
  async function fetchThreads() {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = new URL('/api/threads', window.location.origin);
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', INITIAL_FETCH_COUNT.toString());
      url.searchParams.append('sort', sortBy);
      
      if (debouncedSearchTerm) {
        url.searchParams.append('search', debouncedSearchTerm);
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }
      
      const data = await response.json();
      setPosts(data.threads || []);
      setHasMorePosts(data.pagination?.hasMore || false);
      setPage(1);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load forum threads. Please try again later.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch more threads when scrolling
  async function fetchMoreThreads() {
    if (isLoadingMore || !hasMorePosts) return;
    
    try {
      setIsLoadingMore(true);
      
      const url = new URL('/api/threads', window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', LOAD_MORE_COUNT.toString());
      url.searchParams.append('sort', sortBy);
      
      if (debouncedSearchTerm) {
        url.searchParams.append('search', debouncedSearchTerm);
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more threads');
      }
      
      const data = await response.json();
      setPosts(prev => [...prev, ...(data.threads || [])]);
      setHasMorePosts(data.pagination?.hasMore || false);
    } catch (err) {
      console.error('Error fetching more threads:', err);
      toast.error('Failed to load more threads');
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Create a debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handlePostClick = async (postId: number) => {
    // Find the clicked post in our existing data
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Create a thread object from the post data
    const initialThreadData: ThreadData = {
      ...post,
      replies: [], // Start with empty replies
      totalReplies: post.replies
    };
    
    // Show the modal with the data we already have
    setSelectedThread(initialThreadData);
    setIsModalOpen(true);
    
    // Now fetch the replies in the background
    setIsRepliesLoading(true);
    try {
      const response = await fetch(`/api/threads/${postId}/replies?page=1&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }
      
      const data = await response.json();
      
      // Update the thread with the fetched replies
      setSelectedThread(prev => prev ? {
        ...prev, 
        replies: data.replies || [], 
        totalReplies: data.totalReplies || prev.totalReplies
      } : null);
    } catch (err) {
      console.error('Error fetching replies:', err);
    } finally {
      setIsRepliesLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedThread(null);
  };

  const handleOpenNewThreadModal = () => {
    if (!session) {
      toast.error('You must be logged in to create a thread');
      return;
    }
    setIsNewThreadModalOpen(true);
  };

  const handleNewThread = async (threadData: { title: string; content: string; tags: string[] }) => {
    if (!session) {
      toast.error('You must be logged in to create a thread');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threadData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create thread');
      }
      
      const newThread = await response.json();
      
      // Add the new thread to our posts list
      setPosts(prevPosts => [newThread, ...prevPosts]);
      
      toast.success('Thread created successfully!');
      setIsNewThreadModalOpen(false);
    } catch (err) {
      console.error('Error creating thread:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThreadVoteChange = (threadId: number, upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote' | null) => {
    // Update the post in the posts array
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === threadId 
          ? { ...post, upvotes, downvotes, userVote } 
          : post
      )
    );
  };

  const handleThreadContentUpdate = (threadId: number, updatedData: ThreadUpdateData) => {
    // Update the thread content in the posts array
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === threadId 
          ? { 
              ...post, 
              title: updatedData.title || post.title,
              content: updatedData.content || post.content,
              tags: updatedData.tags || post.tags,
              wasEdited: updatedData.wasEdited,
              editedTimeAgo: updatedData.editedTimeAgo
            } 
          : post
      )
    );
  };

  const handleThreadDelete = (threadId: number) => {
    // Remove the thread from the posts list
    setPosts(prevPosts => prevPosts.filter(post => post.id !== threadId));
    
    // Close the modal if it's open
    setIsModalOpen(false);
  };
  
  return (
    <main className='relative flex min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] text-white'>
      {/* Main Content */}
      <div className="flex-1 p-8 pt-8">
        <ForumControls 
          searchTerm={searchTerm}
          setSearchTerm={handleSearchChange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onNewThread={handleOpenNewThreadModal}
        />
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-300">
            <p>{error}</p>
            <button 
              onClick={() => fetchThreads()} 
              className="mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p>No threads found. Be the first to start a discussion!</p>
            <button
              onClick={handleOpenNewThreadModal}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
            >
              Create Thread
            </button>
          </div>
        ) : (
          <>
            <PostList 
              posts={posts} 
              onPostClick={handlePostClick}
              onVoteChange={handleThreadVoteChange}
            />
            {/* Loader reference element */}
            {(hasMorePosts || isLoadingMore) && (
              <div 
                ref={loaderRef} 
                className="py-4 flex justify-center"
              >
                {isLoadingMore ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <button
                    onClick={loadMorePosts}
                    className="px-4 py-2 bg-blue-600/30 border border-blue-400/30 rounded-lg text-blue-300 hover:bg-blue-600/50 transition-colors"
                  >
                    Load more
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div className="hidden lg:block lg:w-80">
        <Sidebar 
        />
      </div>
      {/* Thread Detail Modal */}
      <ThreadDetailModal
        isOpen={isModalOpen}
        thread={selectedThread}
        onClose={handleCloseModal}
        isRepliesLoading={isRepliesLoading}
        onThreadVoteChange={handleThreadVoteChange}
        onThreadContentUpdate={handleThreadContentUpdate} 
        onThreadDelete={handleThreadDelete}
      />
      
      {/* New Thread Modal */}
      <NewThreadModal 
        isOpen={isNewThreadModalOpen}
        onClose={() => setIsNewThreadModalOpen(false)}
        onSubmit={handleNewThread}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}