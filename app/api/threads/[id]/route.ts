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
        { error: 'You must be logged in to edit a thread' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const threadId = params.id;
    const { title, content, tags = [] } = await request.json();
    
    // Validate input
    if (!title || !content || title.trim() === '' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Check if user is the author
    const threadResult = await sql`
      SELECT author_id FROM threads WHERE id = ${threadId}
    `;
    
    if (threadResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    if (threadResult.rows[0].author_id !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own threads' },
        { status: 403 }
      );
    }
    
    try {
      // Begin transaction
      await sql`BEGIN`;
      
      // Update the thread
      const updatedThreadResult = await sql`
        UPDATE threads 
        SET title = ${title.trim()}, content = ${content.trim()}, updated_at = NOW() AT TIME ZONE 'UTC'
        WHERE id = ${threadId}
        RETURNING id, title, content, created_at AT TIME ZONE 'UTC', updated_at AT TIME ZONE 'UTC'
      `;
      
      // Delete existing tags
      await sql`DELETE FROM thread_tags WHERE thread_id = ${threadId}`;
      
      // Process new tags using forum_tags table
      const tagObjects = [];
      if (tags.length > 0) {
        for (const tagName of tags) {
          const normalizedTag = tagName.trim().toLowerCase();
          if (!normalizedTag) continue;
          
          // Check if tag exists in forum_tags
          const tagResult = await sql`
            SELECT id FROM forum_tags WHERE name = ${normalizedTag};
          `;
          
          let tagId;
          if (tagResult.rows.length === 0) {
            // Create new tag in forum_tags
            const newTag = await sql`
              INSERT INTO forum_tags (name) VALUES (${normalizedTag}) RETURNING id;
            `;
            tagId = newTag.rows[0].id;
          } else {
            tagId = tagResult.rows[0].id;
          }
          
          // Link tag to thread in thread_tags
          await sql`
            INSERT INTO thread_tags (thread_id, forum_tag_id)
            VALUES (${threadId}, ${tagId})
            ON CONFLICT (thread_id, forum_tag_id) DO NOTHING;
          `;
          
          tagObjects.push({
            id: tagId,
            name: normalizedTag
          });
        }
      }
      
      // Commit transaction
      await sql`COMMIT`;
      
      const updatedThread = updatedThreadResult.rows[0];
      
      return NextResponse.json({
        id: updatedThread.id,
        title: updatedThread.title,
        content: formatContent(updatedThread.content),
        wasEdited: true,
        editedTimeAgo: 'just now',
        tags: tags
      });
      
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      console.error('Error updating thread:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error handling thread update:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
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
        { error: 'You must be logged in to delete a thread' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const threadId = params.id;
    
    // Check if the thread exists and belongs to the user
    const threadResult = await sql`
      SELECT * FROM threads
      WHERE id = ${threadId} AND author_id = ${userId}
    `;
    
    if (threadResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found or you do not have permission to delete it' },
        { status: 403 }
      );
    }
    
    // Begin transaction
    await sql`BEGIN`;
    
    try {
      // Delete all comments associated with this thread
      await sql`
        DELETE FROM comments
        WHERE thread_id = ${threadId}
      `;
      
      // Delete all votes associated with this thread
      await sql`
        DELETE FROM thread_votes
        WHERE thread_id = ${threadId}
      `;
      
      // Delete tag associations
      await sql`
        DELETE FROM thread_tags
        WHERE thread_id = ${threadId}
      `;
      
      // Delete the thread
      await sql`
        DELETE FROM threads
        WHERE id = ${threadId}
      `;
      
      // Commit transaction
      await sql`COMMIT`;
      
      return NextResponse.json({ message: 'Thread deleted successfully' });
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      throw error;
    }
    
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}