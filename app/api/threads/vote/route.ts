import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to vote' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { threadId, voteType, action } = await request.json();
    
    // Validate input
    if (!threadId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Process the vote based on the action and voteType
    try {
      // Begin transaction
      await sql`BEGIN`;
      
      // Check if the user has already voted on this thread
      const existingVote = await sql`
        SELECT vote_type FROM thread_votes 
        WHERE thread_id = ${threadId} AND user_id = ${userId}
      `;
      
      const hasExistingVote = existingVote.rows.length > 0;
      const existingVoteType = hasExistingVote ? existingVote.rows[0].vote_type : null;
      
      if (action === 'remove' && existingVoteType === voteType) {
        // User is removing their vote
        await sql`
          DELETE FROM thread_votes
          WHERE thread_id = ${threadId} AND user_id = ${userId}
        `;
        
        // Decrement vote count
        if (voteType === 'upvote') {
          await sql`UPDATE threads SET upvotes = upvotes - 1 WHERE id = ${threadId}`;
        } else {
          await sql`UPDATE threads SET downvotes = downvotes - 1 WHERE id = ${threadId}`;
        }
      } else if (hasExistingVote && existingVoteType !== voteType) {
        // User is changing their vote
        await sql`
          UPDATE thread_votes
          SET vote_type = ${voteType}
          WHERE thread_id = ${threadId} AND user_id = ${userId}
        `;
        
        // Update vote counts
        if (existingVoteType === 'upvote' && voteType === 'downvote') {
          await sql`UPDATE threads SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ${threadId}`;
        } else if (existingVoteType === 'downvote' && voteType === 'upvote') {
          await sql`UPDATE threads SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = ${threadId}`;
        }
      } else if (!hasExistingVote) {
        // User is voting for the first time
        await sql`
          INSERT INTO thread_votes (thread_id, user_id, vote_type)
          VALUES (${threadId}, ${userId}, ${voteType})
        `;
        
        // Increment vote count
        if (voteType === 'upvote') {
          await sql`UPDATE threads SET upvotes = upvotes + 1 WHERE id = ${threadId}`;
        } else {
          await sql`UPDATE threads SET downvotes = downvotes + 1 WHERE id = ${threadId}`;
        }
      }
      
      // Commit transaction
      await sql`COMMIT`;
      
      return NextResponse.json({ success: true, voteType });
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      console.error('Error processing vote:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error handling vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}