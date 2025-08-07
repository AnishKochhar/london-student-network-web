import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { formatContent, getTimeAgo, getAvatarInitials } from '@/app/lib/forum-utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;  // This is the thread ID, not a comment ID
    const session = await auth();
    const userId = session?.user?.id;
    
    // Fetch top-level comments for the thread (where parent_id is NULL)
    const repliesResult = await sql`
      SELECT c.*, u.name as author_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.thread_id = ${threadId} AND c.parent_id IS NULL
      ORDER BY c.created_at ASC
    `;
    
    // Format the replies
    const replies = await Promise.all(repliesResult.rows.map(async (reply) => {
      // Get user's vote on this comment if logged in
      let userVote = null;
      if (userId) {
        const voteResult = await sql`
          SELECT vote_type 
          FROM comments_votes
          WHERE comment_id = ${reply.id} AND user_id = ${userId}
        `;
        
        if (voteResult.rows.length > 0) {
          userVote = voteResult.rows[0].vote_type;
        }
      }
      
      // Get count of replies to this comment
      const repliesCount = await sql`
        SELECT COUNT(*) as count
        FROM comments
        WHERE parent_id = ${reply.id}
      `;

      const replyCount = parseInt(repliesCount.rows[0].count);
      const hasReplies = replyCount > 0;
      const authorName = reply.author_name || 'Anonymous';
      
      return {
        id: reply.id,
        thread_id: reply.thread_id,
        parent_id: reply.parent_id,
        content: formatContent(reply.content),
        author: authorName,
        avatar: getAvatarInitials(authorName),
        timeAgo: getTimeAgo(reply.created_at),
        upvotes: reply.upvotes || 0,
        downvotes: reply.downvotes || 0,
        userVote,
        hasReplies,
        replyCount
      };
    }));
    
    return NextResponse.json(replies);
    
  } catch (error) {
    console.error('Error fetching thread comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread comments' },
      { status: 500 }
    );
  }
}