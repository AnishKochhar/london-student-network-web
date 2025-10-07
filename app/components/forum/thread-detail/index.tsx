"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { createPortal } from "react-dom";
import {
    XMarkIcon,
    ChatBubbleLeftIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import {
    ThreadData,
    ViewContext as ImportedViewContext,
    Reply,
    CommentUpdateData,
} from "@/app/lib/types";
import { useSession } from "next-auth/react";
import { useKeyboardShortcuts } from "@/app/hooks/useKeyboardShortcuts";

import ThreadContent from "./thread-content";
import CommentContent from "./comment-content";
import ReplyList from "./reply-list";
import ReplyForm from "./reply-form";
import { useCommentNav } from "./hooks/useCommentNav";
import { useThreadState } from "@/app/lib/hooks/useThreadState";
import * as threadService from "@/app/lib/services/thread-service";

// Types
export interface ThreadUpdateData {
    title?: string;
    content?: string;
    tags?: string[];
    upvotes?: number;
    downvotes?: number;
    userVote?: "upvote" | "downvote" | null;
    replies?: Reply[];
    replyCount?: number;
    wasEdited?: boolean;
    editedTimeAgo?: string;
}

type ViewContext = ImportedViewContext;

interface ThreadDetailModalProps {
    isOpen: boolean;
    thread: ThreadData | null;
    onClose: () => void;
    isRepliesLoading?: boolean;
    onThreadVoteChange?: (
        threadId: number,
        upvotes: number,
        downvotes: number,
        userVote: string | null,
    ) => void;
    onThreadContentUpdate?: (
        threadId: number,
        updatedData: ThreadUpdateData,
    ) => void;
    onThreadDelete?: (threadId: number) => void;
}

const ThreadDetailModal = ({
    isOpen,
    thread: initialThread,
    onClose,
    isRepliesLoading = false,
    onThreadVoteChange,
    onThreadContentUpdate,
    onThreadDelete,
}: ThreadDetailModalProps) => {
    // Hooks
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [newReply, setNewReply] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCommentReplies, setIsLoadingCommentReplies] =
        useState(false);

    // Use a ref to track which threads we've already fetched replies for
    const fetchedThreadReplies = useRef(new Set<number>());

    // Thread state management
    const {
        threadData,
        commentReplies,
        setThreadData,
        updateThread,
        updateReply,
        addReply,
        deleteReply,
        setReplies,
        setCommentReplies,
    } = useThreadState(initialThread);

    // Comment navigation
    const { viewContext, navigateToComment, navigateBack, setViewContext } =
        useCommentNav(threadData);

    // Keyboard shortcuts
    useKeyboardShortcuts(
        [
            {
                key: "Escape",
                callback: () => {
                    if (viewContext?.type === "comment") {
                        navigateBack();
                    } else {
                        onClose();
                    }
                },
                preventDefault: true,
            },
        ],
        isOpen,
    );

    // Effect for client-side rendering
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Initialize thread data when the prop changes
    useEffect(() => {
        if (initialThread) {
            // Reset fetched replies if thread ID changes
            if (threadData?.id !== initialThread.id) {
                fetchedThreadReplies.current = new Set();
            }
            setThreadData(initialThread);
        }
    }, [initialThread, threadData?.id, setThreadData]);

    // Fetch thread replies if needed
    useEffect(() => {
        const fetchRepliesIfNeeded = async () => {
            if (
                threadData &&
                threadData.id &&
                !fetchedThreadReplies.current.has(threadData.id) &&
                (!threadData.replies || !Array.isArray(threadData.replies))
            ) {
                fetchedThreadReplies.current.add(threadData.id);
                const { replies } = await threadService.fetchThreadReplies(
                    threadData.id,
                );
                setReplies(replies);
            }
        };

        fetchRepliesIfNeeded();
    }, [threadData, setReplies]);

    // Fetch comment replies when view context changes
    useEffect(() => {
        const fetchCommentRepliesIfNeeded = async () => {
            if (viewContext?.type === "comment") {
                setIsLoadingCommentReplies(true);
                const replies = await threadService.fetchCommentReplies(
                    viewContext.commentId,
                );
                setCommentReplies(replies);
                setIsLoadingCommentReplies(false);
            }
        };

        fetchCommentRepliesIfNeeded();
    }, [viewContext, setCommentReplies]);

    // Handler functions
    const handleVoteChange = useCallback(
        (
            threadId: number,
            upvotes: number,
            downvotes: number,
            userVote: "upvote" | "downvote" | null,
        ) => {
            updateThread(threadId, { upvotes, downvotes, userVote });

            if (onThreadVoteChange) {
                onThreadVoteChange(threadId, upvotes, downvotes, userVote);
            }
        },
        [updateThread, onThreadVoteChange],
    );

    const handleSubmitReply = useCallback(
        async (replyContent: string) => {
            if (!threadData || !replyContent.trim()) return;

            setIsSubmitting(true);

            const parentId =
                viewContext?.type === "comment" ? viewContext.commentId : null;
            const newReply = await threadService.submitReply(
                threadData.id,
                replyContent.trim(),
                parentId,
            );

            if (newReply) {
                // Add reply to appropriate list
                addReply(newReply, parentId);

                // Update comment reply count if needed
                if (viewContext?.type === "comment" && viewContext.comment) {
                    const updatedReplyCount =
                        (viewContext.comment.replyCount || 0) + 1;

                    updateReply(viewContext.comment.id, {
                        replyCount: updatedReplyCount,
                    });

                    setViewContext({
                        ...viewContext,
                        comment: {
                            ...viewContext.comment,
                            replyCount: updatedReplyCount,
                        },
                    });
                }

                // Update thread reply count if needed
                if (parentId === null && onThreadContentUpdate && threadData) {
                    const newReplyCount =
                        typeof threadData.replies === "number"
                            ? threadData.replies + 1
                            : Array.isArray(threadData.replies)
                              ? threadData.replies.length + 1
                              : 1;

                    onThreadContentUpdate(threadData.id, {
                        replyCount: newReplyCount,
                    });
                }

                setNewReply("");
            }

            setIsSubmitting(false);
        },
        [
            threadData,
            viewContext,
            addReply,
            updateReply,
            setViewContext,
            onThreadContentUpdate,
        ],
    );

    const handleReplyDelete = useCallback(
        (replyId: number) => {
            // Check if the deleted reply is the one currently being viewed
            const isCurrentlyViewedComment =
                viewContext?.type === "comment" &&
                viewContext.commentId === replyId;

            // Check if it's a thread reply
            const isThreadReply =
                threadData?.replies &&
                Array.isArray(threadData.replies) &&
                threadData.replies.some((r) => r.id === replyId);

            deleteReply(replyId);

            // Update thread reply count
            if (isThreadReply && onThreadContentUpdate && threadData) {
                const newReplyCount =
                    typeof threadData.replies === "number"
                        ? Math.max(0, threadData.replies - 1)
                        : Array.isArray(threadData.replies)
                          ? Math.max(0, threadData.replies.length - 1)
                          : 0;

                onThreadContentUpdate(threadData.id, {
                    replyCount: newReplyCount,
                });
            }

            // Update comment reply count
            if (
                viewContext?.type === "comment" &&
                viewContext.commentId !== replyId
            ) {
                const isDirectChild = commentReplies.some(
                    (r) => r.id === replyId,
                );

                if (isDirectChild && viewContext.comment.replyCount > 0) {
                    const updatedReplyCount = Math.max(
                        0,
                        viewContext.comment.replyCount - 1,
                    );

                    updateReply(viewContext.comment.id, {
                        replyCount: updatedReplyCount,
                    });

                    setViewContext({
                        ...viewContext,
                        comment: {
                            ...viewContext.comment,
                            replyCount: updatedReplyCount,
                        },
                    });
                }
            }

            // If the deleted comment is the one currently being viewed, navigate back
            if (isCurrentlyViewedComment) {
                navigateBack();
            }
        },
        [
            threadData,
            commentReplies,
            viewContext,
            deleteReply,
            updateReply,
            setViewContext,
            onThreadContentUpdate,
            navigateBack,
        ],
    );

    const handleThreadUpdate = useCallback(
        (threadId: number, updatedData: ThreadUpdateData) => {
            if (threadData?.id !== threadId) return;

            updateThread(threadId, updatedData);

            if (onThreadContentUpdate) {
                onThreadContentUpdate(threadId, updatedData);
            }
        },
        [threadData, updateThread, onThreadContentUpdate],
    );

    const handleThreadDelete = useCallback(
        (threadId: number) => {
            onClose();

            if (onThreadDelete) {
                onThreadDelete(threadId);
            }
        },
        [onClose, onThreadDelete],
    );

    const handleCommentUpdate = useCallback(
        (commentId: number, updatedData: CommentUpdateData) => {
            // Update the reply in the replies array
            updateReply(commentId, updatedData);

            // If this is the current comment being viewed, update it in the viewContext as well
            if (
                viewContext?.type === "comment" &&
                viewContext.commentId === commentId
            ) {
                setViewContext((prev) => {
                    if (!prev || prev.type !== "comment") return prev;
                    return {
                        ...prev,
                        comment: {
                            ...prev.comment,
                            ...updatedData,
                        },
                    };
                });
            }
        },
        [updateReply, viewContext, setViewContext],
    );

    const handleReplyVoteChange = useCallback(
        (
            replyId: number,
            upvotes: number,
            downvotes: number,
            userVote: string | null,
        ) => {
            updateReply(replyId, { upvotes, downvotes, userVote });

            // Update view context if this is the current comment
            if (
                viewContext?.type === "comment" &&
                viewContext.commentId === replyId
            ) {
                setViewContext({
                    ...viewContext,
                    comment: {
                        ...viewContext.comment,
                        upvotes,
                        downvotes,
                        userVote,
                    },
                });
            }
        },
        [updateReply, viewContext, setViewContext],
    );

    const handleCommentVote = useCallback(
        (voteType: "upvote" | "downvote") => {
            if (viewContext?.type !== "comment" || !viewContext.comment) return;

            const { comment } = viewContext;
            const { upvotes = 0, downvotes = 0, userVote } = comment;

            // Calculate new vote state
            let newUpvotes = upvotes;
            let newDownvotes = downvotes;
            let newUserVote: "upvote" | "downvote" | null = voteType;

            if (userVote === voteType) {
                // Removing vote
                if (voteType === "upvote")
                    newUpvotes = Math.max(0, newUpvotes - 1);
                else newDownvotes = Math.max(0, newDownvotes - 1);
                newUserVote = null;
            } else if (userVote) {
                // Changing vote
                if (userVote === "upvote")
                    newUpvotes = Math.max(0, newUpvotes - 1);
                else newDownvotes = Math.max(0, newDownvotes - 1);

                if (voteType === "upvote") newUpvotes++;
                else newDownvotes++;
            } else {
                // New vote
                if (voteType === "upvote") newUpvotes++;
                else newDownvotes++;
            }

            // Update state
            const updatedVotes = {
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                userVote: newUserVote,
            };
            updateReply(comment.id, updatedVotes);

            setViewContext({
                ...viewContext,
                comment: {
                    ...comment,
                    ...updatedVotes,
                },
            });
        },
        [viewContext, updateReply, setViewContext],
    );

    // Early return if modal is not open or no thread data
    if (!isOpen || !threadData || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-start sm:items-center justify-start sm:justify-center p-0 sm:p-4">
                <div className="relative w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] mx-auto bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 sm:rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <ModalHeader
                        viewContext={viewContext}
                        navigateBack={navigateBack}
                        onClose={onClose}
                    />

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Main Content (Thread or Comment) */}
                            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3 sm:p-6">
                                {viewContext?.type === "thread" ? (
                                    <ThreadContent
                                        thread={threadData}
                                        onVoteChange={handleVoteChange}
                                        onThreadUpdate={handleThreadUpdate}
                                        onThreadDelete={handleThreadDelete}
                                    />
                                ) : viewContext ? (
                                    <CommentContent
                                        comment={viewContext.comment}
                                        votes={{
                                            upvotes:
                                                viewContext.comment.upvotes ||
                                                0,
                                            downvotes:
                                                viewContext.comment.downvotes ||
                                                0,
                                            userVote:
                                                viewContext.comment.userVote ||
                                                null,
                                        }}
                                        handleVote={handleCommentVote}
                                        replyCount={commentReplies.length}
                                        onCommentUpdate={handleCommentUpdate}
                                        onCommentDelete={handleReplyDelete}
                                    />
                                ) : null}
                            </div>

                            {/* Replies Section */}
                            <ReplyList
                                viewContext={viewContext}
                                threadReplies={
                                    Array.isArray(threadData.replies)
                                        ? threadData.replies
                                        : []
                                }
                                commentReplies={commentReplies}
                                isRepliesLoading={
                                    isRepliesLoading || isLoadingCommentReplies
                                }
                                navigateToComment={navigateToComment}
                                onReplyUpdate={updateReply}
                                onReplyDelete={handleReplyDelete}
                                onReplyVoteChange={handleReplyVoteChange}
                            />
                        </div>
                    </div>

                    {/* Reply Input Form */}
                    <ReplyForm
                        session={session}
                        newReply={newReply}
                        setNewReply={setNewReply}
                        isSubmitting={isSubmitting}
                        handleSubmitReply={() => handleSubmitReply(newReply)}
                        viewContext={viewContext}
                    />
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

// Modal header component
interface ModalHeaderProps {
    viewContext: ViewContext | null;
    navigateBack: () => void;
    onClose: () => void;
}

const ModalHeader = memo(
    ({ viewContext, navigateBack, onClose }: ModalHeaderProps) => (
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-white/10 flex-shrink-0 sticky top-0 bg-[#041A2E] z-10">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {viewContext?.type === "comment" && (
                    <button
                        onClick={navigateBack}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        title="Back to main thread"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-white/80" />
                    </button>
                )}
                <ChatBubbleLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />

                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                        {viewContext?.type === "comment" ? "Thread" : "Discussion"}
                    </h2>

                    {viewContext?.type === "comment" && (
                        <>
                            <span className="text-white/40 flex-shrink-0">/</span>
                            <span className="text-sm sm:text-base text-white/80 truncate">
                                Reply by @{viewContext.comment.author}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <button
                onClick={onClose}
                className="p-1 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close"
            >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
            </button>
        </div>
    ),
);

ModalHeader.displayName = "ModalHeader";

export default memo(ThreadDetailModal);
