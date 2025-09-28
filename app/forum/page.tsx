"use client";

import { useState, useCallback, useEffect } from "react";
import ForumControls, {
    ActiveFilter,
} from "../components/forum/forum-controls";
import PostList from "../components/forum/post-list";
import Sidebar from "../components/forum/sidebar";
import ThreadDetailModal from "../components/forum/thread-detail";
import NewThreadModal from "../components/forum/new-thread-modal";
import UsernameCreationModal from "../components/forum/username-creation-modal";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useDebounce } from "../components/forum/hooks/useDebounce";
import { useForumThreads } from "../components/forum/hooks/useForumThreads";
import * as threadService from "@/app/lib/services/thread-service";
import { ThreadData, ThreadUpdateData } from "@/app/lib/types";

const SEARCH_DEBOUNCE_DELAY = 300;

export default function ForumPage() {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);
    const [sortBy, setSortBy] = useState("Newest First");
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

    // Thread modals state
    const [selectedThread, setSelectedThread] = useState<ThreadData | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
    const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
    const [isRepliesLoading, setIsRepliesLoading] = useState(false);
    const [userHasUsername, setUserHasUsername] = useState<boolean | null>(null);

    // Forum threads state and handlers using custom hook
    const {
        posts,
        setPosts,
        isLoading,
        error,
        hasMorePosts,
        isLoadingMore,
        loaderRef,
        loadMorePosts,
        fetchThreads,
    } = useForumThreads(debouncedSearchTerm, sortBy, activeFilters);

    // Handle search term changes
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    // Filter handlers
    const handleAddFilter = useCallback((filter: ActiveFilter) => {
        setActiveFilters((prev) => [...prev, filter]);
    }, []);

    const handleRemoveFilter = useCallback((filterId: string) => {
        setActiveFilters((prev) => prev.filter((f) => f.id !== filterId));
    }, []);

    const handleAddTopicFilter = useCallback(
        (topicName: string) => {
            const filterId = `topic-${topicName}`;
            const existingFilter = activeFilters.find((f) => f.id === filterId);

            if (existingFilter) {
                // Remove the filter if it already exists (toggle off)
                handleRemoveFilter(filterId);
            } else {
                // Add the filter if it doesn't exist
                handleAddFilter({
                    id: filterId,
                    type: "tag",
                    label: topicName,
                    value: topicName,
                });
            }
        },
        [activeFilters, handleAddFilter, handleRemoveFilter],
    );

    const handleAddAuthorFilter = useCallback(
        (username: string) => {
            const filterId = `author-${username}`;
            const existingFilter = activeFilters.find((f) => f.id === filterId);

            if (existingFilter) {
                // Remove the filter if it already exists (toggle off)
                handleRemoveFilter(filterId);
            } else {
                // Add the filter if it doesn't exist
                handleAddFilter({
                    id: filterId,
                    type: "author",
                    label: `@${username}`,
                    value: username,
                });
            }
        },
        [activeFilters, handleAddFilter, handleRemoveFilter],
    );

    // Thread actions
    const handlePostClick = useCallback(
        async (postId: number) => {
            // Find the clicked post in our existing data
            const post = posts.find((p) => p.id === postId);
            if (!post) return;

            // Create a thread object from the post data
            const initialThreadData: ThreadData = {
                ...post,
                replies: [],
                replyCount: post.replyCount || 0,
            };

            // Show the modal with the data we already have
            setSelectedThread(initialThreadData);
            setIsModalOpen(true);

            // Now fetch the replies in the background
            setIsRepliesLoading(true);
            try {
                const { replies, topLevelCount } =
                    await threadService.fetchThreadReplies(postId, 0, 10);

                // Update the thread with the fetched replies
                setSelectedThread((prev) =>
                    prev
                        ? {
                              ...prev,
                              replies: replies,
                              replyCount: topLevelCount,
                          }
                        : null,
                );
            } finally {
                setIsRepliesLoading(false);
            }
        },
        [posts],
    );

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedThread(null);
    }, []);

    // Check if user has username when session changes
    const checkUserUsername = useCallback(async () => {
        if (!session?.user?.id) {
            setUserHasUsername(null);
            return;
        }

        try {
            const response = await fetch("/api/username/get");
            if (response.ok) {
                const data = await response.json();
                setUserHasUsername(data.hasUsername);
            } else {
                setUserHasUsername(false);
            }
        } catch (error) {
            console.error("Error checking username:", error);
            setUserHasUsername(false);
        }
    }, [session?.user?.id]);

    // Check username when session loads
    useEffect(() => {
        checkUserUsername();
    }, [checkUserUsername]);

    const handleOpenNewThreadModal = useCallback(async () => {
        if (!session) {
            toast.error("You must be logged in to create a thread");
            return;
        }

        // Check if user has a username first
        if (userHasUsername === null) {
            // Still loading, check again
            await checkUserUsername();
            return;
        }

        if (!userHasUsername) {
            // For organiser and company accounts, automatically create username from their name
            if (session.user?.role === 'organiser' || session.user?.role === 'company') {
                try {
                    const response = await fetch("/api/username/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: session.user.name })
                    });

                    const result = await response.json();

                    if (result.success) {
                        setUserHasUsername(true);
                        toast.success(`Username created: ${result.username}`);
                        // Automatically open the new thread modal
                        setTimeout(() => {
                            setIsNewThreadModalOpen(true);
                        }, 500);
                        return;
                    } else {
                        toast.error(result.error || "Failed to create username");
                        return;
                    }
                } catch (error) {
                    console.error("Error auto-creating username:", error);
                    toast.error("Error creating username");
                    return;
                }
            } else {
                // For user accounts, show username creation modal
                setIsUsernameModalOpen(true);
                return;
            }
        }

        // User has username, open thread creation modal
        setIsNewThreadModalOpen(true);
    }, [session, userHasUsername, checkUserUsername]);

    const handleUsernameCreated = useCallback((username: string) => {
        setUserHasUsername(true);
        setIsUsernameModalOpen(false);
        toast.success(`Welcome, @${username}! You can now create threads.`);
        // Automatically open the new thread modal after username creation
        setTimeout(() => {
            setIsNewThreadModalOpen(true);
        }, 500);
    }, []);

    const handleThreadCreated = useCallback(
        (newThread: ThreadData) => {
            // Add the new thread to our posts list
            setPosts((prevPosts) => [newThread, ...prevPosts]);
            setIsNewThreadModalOpen(false);
        },
        [setPosts],
    );

    // Thread update handlers
    const handleThreadVoteChange = useCallback(
        (
            threadId: number,
            upvotes: number,
            downvotes: number,
            userVote: string | null,
        ) => {
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === threadId
                        ? { ...post, upvotes, downvotes, userVote }
                        : post,
                ),
            );
        },
        [setPosts],
    );

    const handleThreadContentUpdate = useCallback(
        (threadId: number, updatedData: ThreadUpdateData) => {
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === threadId
                        ? {
                              ...post,
                              title: updatedData.title || post.title,
                              content: updatedData.content || post.content,
                              tags: updatedData.tags || post.tags,
                              wasEdited: updatedData.wasEdited,
                              editedTimeAgo: updatedData.editedTimeAgo,
                          }
                        : post,
                ),
            );
        },
        [setPosts],
    );

    const handleThreadDelete = useCallback(
        (threadId: number) => {
            setPosts((prevPosts) =>
                prevPosts.filter((post) => post.id !== threadId),
            );
            setIsModalOpen(false);
        },
        [setPosts],
    );

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] text-white">
            <div className="flex">
                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-8 pt-4 sm:pt-8 min-w-0">
                <ForumControls
                    searchTerm={searchTerm}
                    setSearchTerm={handleSearchChange}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onNewThread={handleOpenNewThreadModal}
                    activeFilters={activeFilters}
                    onAddFilter={handleAddFilter}
                    onRemoveFilter={handleRemoveFilter}
                    isLoggedIn={!!session}
                />
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-300">
                        <p>{error}</p>
                        <button
                            onClick={fetchThreads}
                            className="mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p>
                            No threads found. Be the first to start a
                            discussion!
                        </p>
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
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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
                <div className="hidden lg:block lg:w-80 flex-shrink-0">
                    <Sidebar
                        onTopicClick={handleAddTopicFilter}
                        onAuthorClick={handleAddAuthorFilter}
                        activeTopics={activeFilters.filter(f => f.type === "tag").map(f => f.value)}
                        activeAuthors={activeFilters.filter(f => f.type === "author").map(f => f.value)}
                    />
                </div>
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
                onThreadCreated={handleThreadCreated}
            />

            {/* Username Creation Modal */}
            <UsernameCreationModal
                isOpen={isUsernameModalOpen}
                onClose={() => setIsUsernameModalOpen(false)}
                onSuccess={handleUsernameCreated}
            />
        </main>
    );
}
