import { sql } from '@vercel/postgres';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getAvatarInitials } from '@/app/lib/forum-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to reply' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { threadId, content, parentId = null } = await request.json();
    
    // Validate input
    if (!threadId || !content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Thread ID and content are required' },
        { status: 400 }
      );
    }
    
    try {
      // Begin transaction
      await sql`BEGIN`;
      
      // Insert the comment
      const commentResult = await sql`
        INSERT INTO comments (thread_id, parent_id, author_id, content, upvotes, downvotes, created_at, updated_at)
        VALUES (${threadId}, ${parentId}, ${userId}, ${content}, 0, 0, NOW(), NOW())
        RETURNING id, created_at, parent_id
      `;
      
      const commentId = commentResult.rows[0].id;
      const createdAt = commentResult.rows[0].created_at;
      const parentCommentId = commentResult.rows[0].parent_id;
      
      // Commit transaction
      await sql`COMMIT`;
      
      // Get the author name
      const userResult = await sql`
        SELECT name FROM users WHERE id = ${userId}
      `;
      
      const authorName = userResult.rows[0]?.name || 'Anonymous';
      
      // Return the newly created comment
      return NextResponse.json({
        id: commentId,
        thread_id: threadId,
        parent_id: parentCommentId,
        content,
        author: authorName,
        authorId: userId,
        avatar: getAvatarInitials(authorName),
        timeAgo: 'just now',
        upvotes: 0,
        downvotes: 0,
        userVote: null,
        created_at: createdAt,
        replyCount: 0,
        hasReplies: false
      });
      
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      console.error('Error creating comment:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error handling comment creation:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}