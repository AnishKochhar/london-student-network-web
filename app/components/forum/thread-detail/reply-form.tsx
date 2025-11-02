import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { ViewContext } from "@/app/lib/types";
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownEditor from "../../markdown/markdown-editor";
import { useKeyboardShortcuts } from "@/app/hooks/useKeyboardShortcuts";

interface ReplyFormProps {
    session: Session | null;
    newReply: string;
    setNewReply: (reply: string) => void;
    isSubmitting: boolean;
    handleSubmitReply: () => void;
    viewContext: ViewContext | null;
    onCollapseAfterSubmit?: () => void;
}

function ReplyForm({
    session,
    newReply,
    setNewReply,
    isSubmitting,
    handleSubmitReply,
    viewContext,
    onCollapseAfterSubmit,
}: ReplyFormProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-collapse after successful submission
    const handleSubmit = async () => {
        await handleSubmitReply();
        setIsExpanded(false);
        if (onCollapseAfterSubmit) {
            onCollapseAfterSubmit();
        }
    };

    const placeholderText = session?.user
        ? viewContext?.type === "comment"
            ? `Reply to @${viewContext.comment.author}...`
            : "Write a reply..."
        : "Log in to reply";

    const handleExpand = () => {
        if (session?.user) {
            setIsExpanded(true);
        }
    };

    const handleCollapse = () => {
        if (!newReply.trim()) {
            setIsExpanded(false);
        }
    };

    // Keyboard shortcuts for submit (Cmd/Ctrl + Enter)
    useKeyboardShortcuts(
        [
            {
                key: "Enter",
                ctrlKey: true,
                callback: () => {
                    if (session?.user && newReply.trim() && !isSubmitting) {
                        handleSubmit();
                    }
                },
                preventDefault: true,
            },
            {
                key: "Enter",
                metaKey: true,
                callback: () => {
                    if (session?.user && newReply.trim() && !isSubmitting) {
                        handleSubmit();
                    }
                },
                preventDefault: true,
            },
        ],
        isExpanded,
    );

    return (
        <div className="border-t border-white/10 bg-white/5 backdrop-blur flex-shrink-0">
            <AnimatePresence mode="wait">
                {!isExpanded ? (
                    // Collapsed state - simple input prompt
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="p-3 sm:p-4"
                    >
                        <div className="flex gap-2 sm:gap-3 items-center">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                                {session?.user
                                    ? session.user.name
                                          ?.split(" ")
                                          .map((part) => part[0]?.toUpperCase() || "")
                                          .slice(0, 2)
                                          .join("") || "U"
                                    : "G"}
                            </div>
                            <button
                                onClick={handleExpand}
                                disabled={!session?.user}
                                className="flex-1 text-left px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-white/60 hover:text-white/80 text-sm sm:text-base disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10"
                            >
                                {placeholderText}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    // Expanded state - full editor
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="p-3 sm:p-6"
                    >
                        <div className="flex gap-2 sm:gap-4">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                                {session?.user
                                    ? session.user.name
                                          ?.split(" ")
                                          .map((part) => part[0]?.toUpperCase() || "")
                                          .slice(0, 2)
                                          .join("") || "U"
                                    : "G"}
                            </div>
                            <div className="flex-1">
                                <div className="relative">
                                    {/* Close button */}
                                    <button
                                        onClick={handleCollapse}
                                        disabled={isSubmitting}
                                        className="absolute top-2 right-2 z-10 p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/90 disabled:opacity-50"
                                        title="Collapse"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>

                                    <MarkdownEditor
                                        value={newReply}
                                        onChange={setNewReply}
                                        placeholder={placeholderText}
                                        height={120}
                                        className="mb-2 sm:mb-3"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={handleCollapse}
                                        disabled={isSubmitting}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={
                                            !session?.user ||
                                            !newReply.trim() ||
                                            isSubmitting
                                        }
                                        className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors text-sm sm:text-base"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <PaperAirplaneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Reply
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default memo(ReplyForm);
