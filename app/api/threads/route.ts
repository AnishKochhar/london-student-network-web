import { getAllThreads, getUserbyID, getTagsbyThreadId, getReplyCountByThreadId } from '@/app/lib/data';
import { formatContent, getTimeAgo, getAvatarInitials } from '@/app/lib/forum-utils';
import { auth } from '@/auth';
import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const threads = await getAllThreads();
    
    // Get user votes if user is logged in
    let userVotes = {};
    if (userId) {
      const votesResult = await sql`
        SELECT thread_id, vote_type 
        FROM thread_votes 
        WHERE user_id = ${userId}
      `;
      
      userVotes = votesResult.rows.reduce((acc, vote) => {
        acc[vote.thread_id] = vote.vote_type;
        return acc;
      }, {});
    }
    
    // Map database threads to ForumPost structure
    const formattedThreads = await Promise.all(
      threads.map(async thread => {
        const user = await getUserbyID(thread.author_id);
        const tagObjects = await getTagsbyThreadId(thread.id);
        
        // Transform tag objects to simple strings
        const tags = tagObjects.map(tagObj => tagObj.tag);
        
        const replyCount = await getReplyCountByThreadId(thread.id);
        
        const authorName = user?.name || 'Anonymous';
        return {
          id: thread.id,
          title: thread.title,
          content: formatContent(thread.content),
          author: authorName,
          timeAgo: getTimeAgo(thread.created_at),
          upvotes: thread.upvotes || 0,
          downvotes: thread.downvotes || 0,
          replies: replyCount || 0,
          tags: tags || [],
          avatar: getAvatarInitials(authorName),
          userVote: userId ? userVotes[thread.id] || null : null
        };
      })
    );
    
    return NextResponse.json(formattedThreads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a thread' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { title, content, tags = [] } = await request.json();
    
    // Validate input
    if (!title || !content || title.trim() === '' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    try {
      // Begin transaction
      await sql`BEGIN`;
      
      // Insert the new thread
      const threadResult = await sql`
        INSERT INTO threads (title, content, created_at, updated_at, upvotes, downvotes, author_id)
        VALUES (${title.trim()}, ${content.trim()}, NOW(), NOW(), 0, 0, ${userId})
        RETURNING id, created_at
      `;
      
      const threadId = threadResult.rows[0].id;
      const createdAt = threadResult.rows[0].created_at;
      
      // Add tags if any
      if (tags.length > 0) {
        for (const tag of tags) {
          await sql`
            INSERT INTO thread_tags (thread_id, tag)
            VALUES (${threadId}, ${tag})
          `;
        }
      }
      
      // Commit transaction
      await sql`COMMIT`;
      
      // Get the author name
      const userResult = await sql`
        SELECT name FROM users WHERE id = ${userId}
      `;
      
      const authorName = userResult.rows[0]?.name || 'Anonymous';
      
      // Return the newly created thread
      return NextResponse.json({
        id: threadId,
        title,
        content: formatContent(content),
        author: authorName,
        avatar: getAvatarInitials(authorName),
        timeAgo: 'just now',
        upvotes: 0,
        downvotes: 0,
        replies: 0,
        tags: tags,
        created_at: createdAt,
        userVote: null
      });
      
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      console.error('Error creating thread:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error handling thread creation:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}