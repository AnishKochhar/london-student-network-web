import { Reply, ThreadData } from '@/app/lib/types';
import { toast } from 'react-hot-toast';

// Fetch thread replies
export async function fetchThreadReplies(threadId: number, offset = 0, limit = 10): Promise<Reply[]> {
  try {
    const response = await fetch(`/api/threads/${threadId}/replies?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch thread replies');
    }
    const data = await response.json();
    
    // Return just the replies array from the paginated response
    return data.replies || [];
  } catch (error) {
    console.error('Error fetching thread replies:', error);
    toast.error('Failed to load replies. Please try again.');
    return [];
  }
}

// Fetch comment replies
export async function fetchCommentReplies(commentId: number): Promise<Reply[]> {
  try {
    const response = await fetch(`/api/comments/${commentId}/replies`);
    if (!response.ok) {
      throw new Error('Failed to fetch comment replies');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    return [];
  }
}

// Submit a reply
export async function submitReply(threadId: number, content: string, parentId: number | null): Promise<Reply | null> {
  try {
    const response = await fetch('/api/replies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        content,
        parentId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit reply');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting reply:', error);
    toast.error('Failed to submit reply. Please try again.');
    return null;
  }
}

// Update thread
export async function updateThread(threadId: number, data: { title: string; content: string; tags: string[] }): Promise<Partial<ThreadData> | null> {
  try {
    const response = await fetch(`/api/threads/${threadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update thread');
    }
    
    const updatedThread = await response.json();
    toast.success('Thread updated successfully');
    return updatedThread;
  } catch (error) {
    console.error('Error updating thread:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update thread');
    return null;
  }
}

// Delete thread
export async function deleteThread(threadId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/threads/${threadId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }
    
    toast.success('Thread deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting thread:', error);
    toast.error('Failed to delete thread. Please try again.');
    return false;
  }
}

// Update comment or reply
export async function updateComment(commentId: number, content: string): Promise<Partial<Reply> | null> {
  try {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update comment');
    }
    
    const updatedComment = await response.json();
    toast.success('Comment updated successfully');
    return updatedComment;
  } catch (error) {
    console.error('Error updating comment:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update comment');
    return null;
  }
}

// Delete comment or reply
export async function deleteComment(commentId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
    
    toast.success('Comment deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    toast.error('Failed to delete comment. Please try again.');
    return false;
  }
}

// Submit votes
export async function submitThreadVote(threadId: number, voteType: 'upvote' | 'downvote', isRemovingVote: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/threads/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        voteType,
        action: isRemovingVote ? 'remove' : 'add'
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to register vote');
    }
    
    return true;
  } catch (error) {
    console.error('Error voting:', error);
    return false;
  }
}

export async function submitReplyVote(replyId: number, voteType: 'upvote' | 'downvote', isRemovingVote: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/replies/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replyId,
        voteType,
        action: isRemovingVote ? 'remove' : 'add'
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to register vote');
    }
    
    return true;
  } catch (error) {
    console.error('Error voting on reply:', error);
    return false;
  }
}