import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAvatarInitials } from '@/app/lib/forum-utils';

export async function GET(request: NextRequest) {
  try {
    // Get the limit parameter from the URL, default to 5
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // Query to get users with the most activity (threads + comments)
    const result = await sql`
      WITH user_activity AS (
        -- Count threads per user
        SELECT 
          u.id,
          u.name,
          COUNT(t.id) as thread_count,
          0 as comment_count
        FROM 
          users u
        LEFT JOIN 
          threads t ON u.id = t.author_id
        GROUP BY 
          u.id, u.name
        
        UNION ALL
        
        -- Count comments per user
        SELECT 
          u.id,
          u.name,
          0 as thread_count,
          COUNT(c.id) as comment_count
        FROM 
          users u
        LEFT JOIN 
          comments c ON u.id = c.author_id
        GROUP BY 
          u.id, u.name
      )
      
      -- Sum up all activity and find top users
      SELECT 
        id,
        name as username,
        SUM(thread_count) as threads,
        SUM(comment_count) as comments,
        SUM(thread_count) + SUM(comment_count) as total_activity,
        -- Consider users with activity in the last week "online"
        CASE WHEN EXISTS (
          SELECT 1 FROM threads 
          WHERE author_id = user_activity.id 
          AND created_at > NOW() - INTERVAL '7 days'
          UNION
          SELECT 1 FROM comments
          WHERE author_id = user_activity.id
          AND created_at > NOW() - INTERVAL '7 days'
        ) THEN 'online' ELSE 'featured' END as status
      FROM 
        user_activity
      GROUP BY 
        id, name
      HAVING 
        SUM(thread_count) + SUM(comment_count) > 0
      ORDER BY 
        total_activity DESC
      LIMIT ${limit};
    `;
    
    // Format the result for the client
    const topUsers = result.rows.map(user => ({
      username: user.username || 'Anonymous',
      displayName: user.username || 'Anonymous',
      userId: user.id,
      avatar: getAvatarInitials(user.username || 'Anonymous'),
      status: user.status,
      stats: {
        threads: parseInt(user.threads),
        comments: parseInt(user.comments),
        totalActivity: parseInt(user.total_activity)
      }
    }));
    
    return NextResponse.json(topUsers);
    
  } catch (error) {
    console.error('Error fetching top users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top users' },
      { status: 500 }
    );
  }
}