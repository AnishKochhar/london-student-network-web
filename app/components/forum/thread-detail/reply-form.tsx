import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Session } from 'next-auth';

interface ReplyFormProps {
  session: Session | null;
  newReply: string;
  setNewReply: (reply: string) => void;
  isSubmitting: boolean;
  handleSubmitReply: () => void;
  viewContext: any; // Using any here for simplicity
}

export default function ReplyForm({ 
  session, 
  newReply, 
  setNewReply, 
  isSubmitting, 
  handleSubmitReply,
  viewContext
}: ReplyFormProps) {
  return (
    <div className="border-t border-white/10 p-6 bg-white/5 backdrop-blur flex-shrink-0">
      <div className="flex gap-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
          {session?.user 
            ? (session.user.name?.split(' ').map(part => part[0]?.toUpperCase() || '').slice(0, 2).join('') || 'U')
            : 'G'
          }
        </div>
        <div className="flex-1">
          <textarea
            id="reply-textarea"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder={session?.user ? 
              viewContext?.type === 'comment' 
                ? `Reply to ${viewContext.comment.author}...` 
                : "Write your reply..." 
              : "Log in to reply"}
            disabled={!session?.user || isSubmitting}
            rows={3}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none mb-3 disabled:opacity-50"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmitReply}
              disabled={!session?.user || !newReply.trim() || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {session?.user ? 'Reply' : 'Log in to reply'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}