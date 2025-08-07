'use client';

import { useState, useEffect, useRef } from 'react';
import ForumControls from '../components/forum/forum-controls';
import PostList from '../components/forum/post-list';
import Sidebar from '../components/forum/sidebar';
import ThreadDetailModal from '../components/forum/thread-detail';
import NewThreadModal from '../components/forum/new-thread-modal';
import { ForumPost, ThreadData } from '../lib/types';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

const trendingTopics = [
  { name: "integration", count: 24 },
  { name: "design", count: 18 },
  { name: "api", count: 15 },
  { name: "react", count: 12 },
  { name: "portfolio", count: 9 }
];

const featuredUsers = [
  { username: "@devmaster", status: "online" as const },
  { username: "@uiqueen", status: "featured" as const }
];

export default function ForumPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRepliesLoading, setIsRepliesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [visiblePosts, setVisiblePosts] = useState<ForumPost[]>([]);
  const [displayCount, setDisplayCount] = useState(3); // Start with 3 threads
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  // Update visible posts when posts, displayCount, or searchTerm change
  useEffect(() => {
    let filtered = posts;
    
    // Apply search filtering if there's a search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = posts.filter(
        post => 
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'Most Popular':
        filtered = [...filtered].sort((a, b) => 
          (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        );
        break;
      case 'Most Replies':
        filtered = [...filtered].sort((a, b) => b.replies - a.replies);
        break;
      case 'Newest First':
      default:
        // The posts are already sorted by newest first from the API
        break;
    }
    
    // Limit to the display count
    setVisiblePosts(filtered.slice(0, displayCount));
    
    // Check if there are more posts to load
    setHasMorePosts(displayCount < filtered.length);
  }, [posts, displayCount, searchTerm, sortBy]);
  
  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMorePosts && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMorePosts, isLoadingMore]);
  
  // Function to load more posts
  const loadMorePosts = () => {
    setIsLoadingMore(true);
    
    // Simulate a delay to show loading indicator
    setTimeout(() => {
      setDisplayCount(prevCount => prevCount + 3); // Load 3 more posts
      setIsLoadingMore(false);
    }, 500);
  };
  
  async function fetchThreads() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/threads');
      
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }
      
      const data = await response.json();
      setPosts(data);
      // Initially display first 3 posts
      setVisiblePosts(data.slice(0, displayCount));
      setHasMorePosts(data.length > displayCount);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load forum threads. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePostClick = async (postId: number) => {
    // Find the clicked post in our existing data
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Create a thread object from the post data
    const initialThreadData: ThreadData = {
      ...post,
      replies: [] // Start with empty replies
    };
    
    // Show the modal with the data we already have
    setSelectedThread(initialThreadData);
    setIsModalOpen(true);
    
    // Now fetch the replies in the background
    setIsRepliesLoading(true);
    try {
      const response = await fetch(`/api/threads/${postId}/replies`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }
      
      const replies = await response.json();
      
      // Update the thread with the fetched replies
      setSelectedThread(prev => prev ? {...prev, replies} : null);
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

  const handleThreadVoteChange = (threadId: number, upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote') => {
  // Update the post in the posts array
  setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === threadId 
          ? { ...post, upvotes, downvotes, userVote } 
          : post
      )
    );
  };
  
  return (
    <main className='relative flex min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] text-white'>
      {/* Main Content */}
      <div className="flex-1 p-8 pt-8">
        <ForumControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
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
            posts={visiblePosts} 
            onPostClick={handlePostClick}
            onVoteChange={handleThreadVoteChange}
          />
          {/* Loader reference element */}
            {hasMorePosts && (
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
      <Sidebar 
        trendingTopics={trendingTopics} 
        featuredUsers={featuredUsers} 
      />

      {/* Thread Detail Modal */}
      <ThreadDetailModal
        isOpen={isModalOpen}
        thread={selectedThread}
        onClose={handleCloseModal}
        isRepliesLoading={isRepliesLoading}
        onThreadVoteChange={handleThreadVoteChange}
      />
      
      {/* New Thread Modal */}
      <NewThreadModal 
        isOpen={isNewThreadModalOpen}
        onClose={() => setIsNewThreadModalOpen(false)}
        onSubmit={handleNewThread}
        isSubmitting={false}
      />
    </main>
  );
}