import { getUserbyID, getTagsbyThreadId } from '@/app/lib/data';
import { formatContent, getTimeAgo, getAvatarInitials } from '@/app/lib/forum-utils';
import { auth } from '@/auth';
import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Get pagination and search parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6'); // Default to 6 threads per page
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort') || 'Newest First';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    const session = await auth();
    const userId = session?.user?.id;
    
    // Build query parts
    let fromClause = 'FROM threads t';
    let whereClause = '';
    let paramIndex = 1;
    const parameters = [];
    
    if (searchTerm && searchTerm.trim() !== '') {
      const searchPattern = `%${searchTerm}%`;
      const searchTerms = searchTerm.trim().split(/\s+/).filter(Boolean);
      
      if (searchTerms.length > 0) {
        // Add join to include tags in search
        fromClause = `
          FROM threads t
          LEFT JOIN thread_tags tt ON t.id = tt.thread_id
          LEFT JOIN forum_tags ft ON tt.forum_tag_id = ft.id
        `;
        
        // Build WHERE clause for search in title, content, or tags
        const searchConditions = [];
        
        // Add conditions for title and content
        searchConditions.push(`(t.title ILIKE $${paramIndex} OR t.content ILIKE $${paramIndex})`);
        parameters.push(searchPattern);
        paramIndex++;
        
        // Add conditions for exact tag matches (for each word in search term)
        const tagConditions = searchTerms.map(term => {
          parameters.push(term.toLowerCase());
          return `ft.name = $${paramIndex++}`;
        });
        
        if (tagConditions.length > 0) {
          searchConditions.push(`(${tagConditions.join(' OR ')})`);
        }
        
        whereClause = `WHERE (${searchConditions.join(' OR ')})`;
      }
    }
    
    // Build SELECT and ORDER BY clauses based on sort option
    let additionalSelect = '';
    let orderByClause = '';
    
    switch (sortBy) {
      case 'Most Popular':
        additionalSelect = ', (t.upvotes - t.downvotes) as popularity_score';
        orderByClause = 'ORDER BY popularity_score DESC, created_at DESC';
        break;
      case 'Most Replies':
        additionalSelect = ', (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.id AND c.parent_id IS NULL) as reply_count';
        orderByClause = 'ORDER BY reply_count DESC, created_at DESC';
        break;
      case 'Newest First':
      default:
        // Reference the column alias 'created_at' instead of 't.created_at'
        orderByClause = 'ORDER BY created_at DESC';
        break;
    }
    
    // Execute thread query using sql.query for more control over the query structure
    const threadsQuery = `
      SELECT DISTINCT
        t.id, t.title, t.content, t.author_id, t.upvotes, t.downvotes, 
        t.created_at AT TIME ZONE 'UTC' as created_at, 
        t.updated_at AT TIME ZONE 'UTC' as updated_at
        ${additionalSelect}
        ${fromClause}
        ${whereClause}
        ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const threadsResult = await sql.query(
      threadsQuery,
      [...parameters, limit, offset]
    );
    
    // Execute count query - make sure it uses the same FROM and WHERE clauses
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) as total 
      ${fromClause}
      ${whereClause}
    `;
    
    const countResult = await sql.query(
      countQuery,
      parameters
    );
    
    const totalThreads = parseInt(countResult.rows[0].total);
    
    // Get user votes if user is logged in
    let userVotes = {};
    if (userId && threadsResult.rows.length > 0) {
      const threadIds = threadsResult.rows.map(t => t.id);
      // Use IN clause rather than ANY for compatibility
      const placeholders = threadIds.map((_, i) => `$${i + 1}`).join(',');
      
      const votesResult = await sql.query(
        `SELECT thread_id, vote_type 
        FROM thread_votes 
        WHERE user_id = $${threadIds.length + 1} AND
        thread_id IN (${placeholders})`,
        [...threadIds, userId]
      );
      
      userVotes = votesResult.rows.reduce((acc, vote) => {
        acc[vote.thread_id] = vote.vote_type;
        return acc;
      }, {});
    }
    
    // Map database threads to ForumPost structure
    const formattedThreads = await Promise.all(
      threadsResult.rows.map(async thread => {
        const user = await getUserbyID(thread.author_id);
        const tagObjects = await getTagsbyThreadId(thread.id);
        
        // Transform tag objects to simple strings
        const tags = tagObjects.map(tagObj => tagObj.name);
        
        // Get reply count for this thread (if not already fetched)
        let replyCount = thread.reply_count;
        if (replyCount === undefined) {
          const replyCountResult = await sql.query(
            'SELECT COUNT(*) as count FROM comments WHERE thread_id = $1 AND parent_id IS NULL',
            [thread.id]
          );
          replyCount = parseInt(replyCountResult.rows[0].count);
        }
        
        const authorName = user?.name || 'Anonymous';
        const wasEdited = new Date(thread.updated_at) > new Date(thread.created_at);

        return {
          id: thread.id,
          title: thread.title,
          content: formatContent(thread.content),
          author: authorName,
          authorId: thread.author_id,
          timeAgo: getTimeAgo(thread.created_at),
          upvotes: thread.upvotes || 0,
          downvotes: thread.downvotes || 0,
          replyCount: replyCount || 0,
          tags: tags || [],
          avatar: getAvatarInitials(authorName),
          userVote: userId ? userVotes[thread.id] || null : null,
          wasEdited: wasEdited,
          editedTimeAgo: wasEdited ? getTimeAgo(thread.updated_at) : undefined,
        };
      })
    );
    
    // Return threads with pagination info
    return NextResponse.json({
      threads: formattedThreads,
      pagination: {
        page,
        limit,
        totalThreads,
        totalPages: Math.ceil(totalThreads / limit),
        hasMore: page * limit < totalThreads
      }
    });
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
      
      // Insert the new thread - explicitly use UTC timestamps
      const threadResult = await sql`
        INSERT INTO threads (title, content, created_at, updated_at, upvotes, downvotes, author_id)
        VALUES (
          ${title.trim()}, 
          ${content.trim()}, 
          CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 
          CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 
          0, 0, 
          ${userId}
        )
        RETURNING 
          id, 
          created_at AT TIME ZONE 'UTC' as created_at, 
          updated_at AT TIME ZONE 'UTC' as updated_at
      `;
      
      const threadId = threadResult.rows[0].id;
      const createdAt = threadResult.rows[0].created_at;
      const updatedAt = threadResult.rows[0].updated_at;
      
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
        authorId: userId,
        avatar: getAvatarInitials(authorName),
        timeAgo: getTimeAgo(createdAt),
        upvotes: 0,
        downvotes: 0,
        replyCount: 0,
        tags: tags,
        created_at: createdAt,
        updated_at: updatedAt,
        userVote: null,
        wasEdited: false
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