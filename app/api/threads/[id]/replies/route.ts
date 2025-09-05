import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { formatContent, getTimeAgo, getAvatarInitials } from '@/app/lib/forum-utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const session = await auth();
    const userId = session?.user?.id;
    
    // Parse URL to get page-based pagination params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1')); // Default to page 1
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50); // Cap at 50
    
    // Calculate the offset from page number
    const offset = (page - 1) * limit;
        
    // Get total count for pagination
    const totalCountResult = await sql`
      SELECT COUNT(*) as count
      FROM comments
      WHERE thread_id = ${threadId} AND parent_id IS NULL
    `;
    const totalCount = parseInt(totalCountResult.rows[0].count);
    
    // Fetch paginated top-level comments for the thread
    const repliesResult = await sql`
      SELECT 
        c.id, 
        c.thread_id, 
        c.parent_id, 
        c.content, 
        c.author_id, 
        c.upvotes, 
        c.downvotes,
        c.created_at AT TIME ZONE 'UTC' as created_at,
        c.updated_at AT TIME ZONE 'UTC' as updated_at,
        u.name as author_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.thread_id = ${threadId} AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
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
      
      // Check if comment was edited
      const wasEdited = reply.updated_at > reply.created_at;
      
      return {
        id: reply.id,
        threadId: reply.thread_id,
        parentId: reply.parent_id,
        content: formatContent(reply.content),
        author: authorName,
        authorId: reply.author_id,
        avatar: getAvatarInitials(authorName),
        timeAgo: getTimeAgo(reply.created_at),
        upvotes: reply.upvotes || 0,
        downvotes: reply.downvotes || 0,
        totalReplies: totalCount,
        userVote,
        hasReplies,
        replyCount,
        wasEdited,
        editedTimeAgo: wasEdited ? getTimeAgo(reply.updated_at) : undefined
      };
    }));
    
    // Calculate if there are more pages
    const hasMore = offset + limit < totalCount;
    const nextPage = hasMore ? page + 1 : null;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Return the replies with page-based pagination info
    return NextResponse.json({
      replies,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
        nextPage
      }
    });
    
  } catch (error) {
    console.error('Error fetching thread replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread replies' },
      { status: 500 }
    );
  }
}