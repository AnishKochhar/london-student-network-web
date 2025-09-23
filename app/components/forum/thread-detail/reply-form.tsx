import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { ViewContext } from "@/app/lib/types";
import { memo } from "react";
import MarkdownEditor from "../../markdown/markdown-editor";

interface ReplyFormProps {
    session: Session | null;
    newReply: string;
    setNewReply: (reply: string) => void;
    isSubmitting: boolean;
    handleSubmitReply: () => void;
    viewContext: ViewContext | null;
}

function ReplyForm({
    session,
    newReply,
    setNewReply,
    isSubmitting,
    handleSubmitReply,
    viewContext,
}: ReplyFormProps) {
    return (
        <div className="border-t border-white/10 p-3 sm:p-6 bg-white/5 backdrop-blur flex-shrink-0">
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
                    <MarkdownEditor
                        value={newReply}
                        onChange={setNewReply}
                        placeholder={
                            session?.user
                                ? viewContext?.type === "comment"
                                    ? `Reply to ${viewContext.comment.author}...`
                                    : "Write your reply..."
                                : "Log in to reply"
                        }
                        height={120}
                        className="mb-2 sm:mb-3"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmitReply}
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
                                    {session?.user
                                        ? "Reply"
                                        : "Log in to reply"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ReplyForm);
