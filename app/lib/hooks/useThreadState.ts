import { useCallback, useReducer } from 'react';
import { ThreadData, Reply } from '@/app/lib/types';

// Action types
type ThreadStateAction =
  | { type: 'SET_THREAD_DATA'; payload: ThreadData }
  | { type: 'UPDATE_THREAD'; payload: { threadId: number; data: Partial<ThreadData> } }
  | { type: 'UPDATE_REPLY'; payload: { replyId: number; data: any } }
  | { type: 'ADD_REPLY'; payload: { reply: Reply; parentId: number | null } }
  | { type: 'DELETE_REPLY'; payload: { replyId: number } }
  | { type: 'SET_REPLIES'; payload: Reply[] }
  | { type: 'SET_COMMENT_REPLIES'; payload: Reply[] };

// State type
interface ThreadState {
  thread: ThreadData | null;
  commentReplies: Reply[];
}

// Initial state
const initialState: ThreadState = {
  thread: null,
  commentReplies: [],
};

// Reducer
function threadReducer(state: ThreadState, action: ThreadStateAction): ThreadState {
  switch (action.type) {
    case 'SET_THREAD_DATA':
      return {
        ...state,
        thread: action.payload,
      };
    case 'UPDATE_THREAD':
      return state.thread && state.thread.id === action.payload.threadId
        ? {
            ...state,
            thread: { ...state.thread, ...action.payload.data },
          }
        : state;
    case 'UPDATE_REPLY':
      return {
        ...state,
        thread: state.thread
          ? {
              ...state.thread,
              replies: Array.isArray(state.thread.replies)
                ? state.thread.replies.map(reply =>
                    reply.id === action.payload.replyId
                      ? { ...reply, ...action.payload.data }
                      : reply
                  )
                : state.thread.replies,
            }
          : null,
        commentReplies: state.commentReplies.map(reply =>
          reply.id === action.payload.replyId ? { ...reply, ...action.payload.data } : reply
        ),
      };
    case 'ADD_REPLY':
      if (!state.thread) return state;
      
      // Add to thread replies if no parentId, otherwise add to comment replies
      if (action.payload.parentId === null) {
        return {
          ...state,
          thread: {
            ...state.thread,
            replies: Array.isArray(state.thread.replies)
              ? [action.payload.reply, ...state.thread.replies]
              : [action.payload.reply],  // Convert number to array with new reply
          },
        };
      } else {
        // It's a reply to a comment, add to commentReplies
        return {
          ...state,
          commentReplies: [action.payload.reply, ...state.commentReplies],
        };
      }
    case 'DELETE_REPLY':
      return {
        ...state,
        thread: state.thread
          ? {
              ...state.thread,
              replies: Array.isArray(state.thread.replies)
                ? state.thread.replies.filter(reply => reply.id !== action.payload.replyId)
                : state.thread.replies,
            }
          : null,
        commentReplies: state.commentReplies.filter(
          reply => reply.id !== action.payload.replyId
        ),
      };
    case 'SET_REPLIES':
      return {
        ...state,
        thread: state.thread ? { ...state.thread, replies: action.payload } : null,
      };
    case 'SET_COMMENT_REPLIES':
      return {
        ...state,
        commentReplies: action.payload,
      };
    default:
      return state;
  }
}

export function useThreadState(initialThread: ThreadData | null) {
  const [state, dispatch] = useReducer(threadReducer, {
    ...initialState,
    thread: initialThread,
  });

  const setThreadData = useCallback((thread: ThreadData) => {
    dispatch({ type: 'SET_THREAD_DATA', payload: thread });
  }, []);

  const updateThread = useCallback((threadId: number, data: Partial<ThreadData>) => {
    dispatch({ type: 'UPDATE_THREAD', payload: { threadId, data } });
  }, []);

  const updateReply = useCallback((replyId: number, data: any) => {
    dispatch({ type: 'UPDATE_REPLY', payload: { replyId, data } });
  }, []);

  const addReply = useCallback((reply: Reply, parentId: number | null) => {
    dispatch({ type: 'ADD_REPLY', payload: { reply, parentId } });
  }, []);

  const deleteReply = useCallback((replyId: number) => {
    dispatch({ type: 'DELETE_REPLY', payload: { replyId } });
  }, []);

  const setReplies = useCallback((replies: Reply[]) => {
    dispatch({ type: 'SET_REPLIES', payload: replies });
  }, []);

  const setCommentReplies = useCallback((replies: Reply[]) => {
    dispatch({ type: 'SET_COMMENT_REPLIES', payload: replies });
  }, []);

  return {
    threadData: state.thread,
    commentReplies: state.commentReplies,
    setThreadData,
    updateThread,
    updateReply,
    addReply,
    deleteReply,
    setReplies,
    setCommentReplies,
  };
}