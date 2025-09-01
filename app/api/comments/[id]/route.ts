import { sql } from '@vercel/postgres';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { formatContent, getTimeAgo } from '@/app/lib/forum-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to edit a comment' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const commentId = params.id;
    const { content } = await request.json();
    
    // Validate input
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Check if user is the author
    const commentResult = await sql`
      SELECT author_id FROM comments WHERE id = ${commentId}
    `;
    
    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    if (commentResult.rows[0].author_id !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }
    
    // Update the comment
    const updatedCommentResult = await sql`
      UPDATE comments 
      SET content = ${content.trim()}, updated_at = NOW() AT TIME ZONE 'UTC'
      WHERE id = ${commentId}
      RETURNING id, content, created_at, updated_at
    `;
    
    const updatedComment = updatedCommentResult.rows[0];
    const wasEdited = new Date(updatedComment.updated_at) > new Date(updatedComment.created_at);
    
    return NextResponse.json({
      id: updatedComment.id,
      content: formatContent(updatedComment.content),
      wasEdited,
      editedTimeAgo: wasEdited ? getTimeAgo(updatedComment.updated_at) : null
    });
    
  } catch (error) {
    console.error('Error handling comment update:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a comment' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const commentId = params.id;
    
    // Check if the comment exists and belongs to the user
    const commentResult = await sql`
      SELECT * FROM comments
      WHERE id = ${commentId} AND author_id = ${userId}
    `;
    
    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found or you do not have permission to delete it' },
        { status: 403 }
      );
    }
    
    // Delete child replies first (recursively)
    const deleteReplies = async (parentId: string) => {
      // Find all direct replies to this comment
      const repliesResult = await sql`
        SELECT id FROM comments
        WHERE parent_id = ${parentId}
      `;
      
      // For each reply, delete its children first
      for (const reply of repliesResult.rows) {
        await deleteReplies(reply.id);
      }
      
      // Delete votes for these replies
      await sql`
        DELETE FROM comments_votes
        WHERE comment_id IN (
          SELECT id FROM comments WHERE parent_id = ${parentId}
        )
      `;
      
      // Delete the replies themselves
      await sql`
        DELETE FROM comments
        WHERE parent_id = ${parentId}
      `;
    };
    
    // Start the recursive deletion with this comment's ID
    await deleteReplies(commentId);
    
    // Delete votes for this comment
    await sql`
      DELETE FROM comments_votes
      WHERE comment_id = ${commentId}
    `;
    
    // Delete the comment itself
    await sql`
      DELETE FROM comments
      WHERE id = ${commentId}
    `;
    
    return NextResponse.json({ message: 'Comment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}