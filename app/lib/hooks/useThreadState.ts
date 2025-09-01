import { useReducer, useCallback } from 'react';
import { ThreadData, Reply } from '@/app/lib/types';

// Define action types
type ThreadAction = 
  | { type: 'SET_THREAD_DATA'; payload: ThreadData }
  | { type: 'UPDATE_THREAD'; payload: { threadId: number; data: Partial<ThreadData> } }
  | { type: 'UPDATE_REPLY'; payload: { replyId: number; data: Partial<Reply> } }
  | { type: 'ADD_REPLY'; payload: { reply: Reply; parentId: number | null } }
  | { type: 'DELETE_REPLY'; payload: { replyId: number } }
  | { type: 'SET_REPLIES'; payload: { replies: Reply[] } }
  | { type: 'SET_COMMENT_REPLIES'; payload: { replies: Reply[] } };

// Initial state
interface ThreadState {
  thread: ThreadData | null;
  commentReplies: Reply[];
}

// Reducer function
function threadReducer(state: ThreadState, action: ThreadAction): ThreadState {
  switch (action.type) {
    case 'SET_THREAD_DATA':
      return { ...state, thread: action.payload };
      
    case 'UPDATE_THREAD':
      if (!state.thread || state.thread.id !== action.payload.threadId) {
        return state;
      }
      return { 
        ...state, 
        thread: { ...state.thread, ...action.payload.data } 
      };
      
    case 'UPDATE_REPLY':
      if (!state.thread?.replies) return state;
      
      return {
        ...state,
        thread: {
          ...state.thread,
          replies: state.thread.replies.map(reply => 
            reply.id === action.payload.replyId 
              ? { ...reply, ...action.payload.data } 
              : reply
          )
        },
        commentReplies: state.commentReplies.map(reply =>
          reply.id === action.payload.replyId
            ? { ...reply, ...action.payload.data }
            : reply
        )
      };
      
    case 'ADD_REPLY':
      if (!state.thread) return state;
      
      // If it's a reply to the main thread
      if (action.payload.parentId === null) {
        return {
          ...state,
          thread: {
            ...state.thread,
            replies: [...(state.thread.replies || []), action.payload.reply]
          }
        };
      } 
      
      // If it's a reply to a comment
      return {
        ...state,
        commentReplies: [...state.commentReplies, action.payload.reply]
      };
      
    case 'DELETE_REPLY':
      if (!state.thread?.replies) return state;
      
      return {
        ...state,
        thread: {
          ...state.thread,
          replies: state.thread.replies.filter(reply => 
            reply.id !== action.payload.replyId
          )
        },
        commentReplies: state.commentReplies.filter(reply =>
          reply.id !== action.payload.replyId
        )
      };
      
    case 'SET_REPLIES':
      if (!state.thread) return state;
      return {
        ...state,
        thread: {
          ...state.thread,
          replies: action.payload.replies
        }
      };
      
    case 'SET_COMMENT_REPLIES':
      return {
        ...state,
        commentReplies: action.payload.replies
      };
      
    default:
      return state;
  }
}

export function useThreadState(initialThread: ThreadData | null) {
  const [state, dispatch] = useReducer(threadReducer, {
    thread: initialThread,
    commentReplies: []
  });
  
  // Memoized action dispatchers
  const setThreadData = useCallback((thread: ThreadData) => {
    dispatch({ type: 'SET_THREAD_DATA', payload: thread });
  }, []);
  
  const updateThread = useCallback((threadId: number, data: Partial<ThreadData>) => {
    dispatch({ type: 'UPDATE_THREAD', payload: { threadId, data } });
  }, []);
  
  const updateReply = useCallback((replyId: number, data: Partial<Reply>) => {
    dispatch({ type: 'UPDATE_REPLY', payload: { replyId, data } });
  }, []);
  
  const addReply = useCallback((reply: Reply, parentId: number | null) => {
    dispatch({ type: 'ADD_REPLY', payload: { reply, parentId } });
  }, []);
  
  const deleteReply = useCallback((replyId: number) => {
    dispatch({ type: 'DELETE_REPLY', payload: { replyId } });
  }, []);
  
  const setReplies = useCallback((replies: Reply[]) => {
    dispatch({ type: 'SET_REPLIES', payload: { replies } });
  }, []);
  
  const setCommentReplies = useCallback((replies: Reply[]) => {
    dispatch({ type: 'SET_COMMENT_REPLIES', payload: { replies } });
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
    setCommentReplies
  };
}