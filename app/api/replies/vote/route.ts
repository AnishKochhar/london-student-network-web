import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "You must be logged in to vote" },
                { status: 401 },
            );
        }

        const userId = session.user.id;
        const { replyId, voteType, action } = await request.json();

        // Validate input
        if (
            !replyId ||
            !voteType ||
            !["upvote", "downvote"].includes(voteType)
        ) {
            return NextResponse.json(
                { error: "Invalid request parameters" },
                { status: 400 },
            );
        }

        try {
            // Begin transaction
            await sql`BEGIN`;

            // Check if the user has already voted on this comment
            const existingVote = await sql`
        SELECT vote_type FROM comments_votes 
        WHERE comment_id = ${replyId} AND user_id = ${userId}
      `;

            const hasExistingVote = existingVote.rows.length > 0;
            const existingVoteType = hasExistingVote
                ? existingVote.rows[0].vote_type
                : null;

            if (action === "remove" && existingVoteType === voteType) {
                // User is removing their vote
                await sql`
          DELETE FROM comments_votes
          WHERE comment_id = ${replyId} AND user_id = ${userId}
        `;

                // Decrement vote count
                if (voteType === "upvote") {
                    await sql`UPDATE comments SET upvotes = upvotes - 1 WHERE id = ${replyId}`;
                } else {
                    await sql`UPDATE comments SET downvotes = downvotes - 1 WHERE id = ${replyId}`;
                }
            } else if (hasExistingVote && existingVoteType !== voteType) {
                // User is changing their vote
                await sql`
          UPDATE comments_votes
          SET vote_type = ${voteType}, created_at = NOW()
          WHERE comment_id = ${replyId} AND user_id = ${userId}
        `;

                // Update vote counts
                if (existingVoteType === "upvote" && voteType === "downvote") {
                    await sql`UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ${replyId}`;
                } else if (
                    existingVoteType === "downvote" &&
                    voteType === "upvote"
                ) {
                    await sql`UPDATE comments SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = ${replyId}`;
                }
            } else if (!hasExistingVote) {
                // User is voting for the first time
                await sql`
          INSERT INTO comments_votes (comment_id, user_id, vote_type, created_at)
          VALUES (${replyId}, ${userId}, ${voteType}, NOW())
        `;

                // Increment vote count
                if (voteType === "upvote") {
                    await sql`UPDATE comments SET upvotes = upvotes + 1 WHERE id = ${replyId}`;
                } else {
                    await sql`UPDATE comments SET downvotes = downvotes + 1 WHERE id = ${replyId}`;
                }
            }

            // Commit transaction
            await sql`COMMIT`;

            // Get updated vote counts
            const updatedReply = await sql`
        SELECT upvotes, downvotes FROM comments WHERE id = ${replyId}
      `;

            return NextResponse.json({
                success: true,
                voteType:
                    existingVoteType === voteType && action === "remove"
                        ? null
                        : voteType,
                upvotes: updatedReply.rows[0].upvotes,
                downvotes: updatedReply.rows[0].downvotes,
            });
        } catch (error) {
            // Rollback on error
            await sql`ROLLBACK`;
            console.error("Error processing vote:", error);
            throw error;
        }
    } catch (error) {
        console.error("Error handling reply vote:", error);
        return NextResponse.json(
            { error: "Failed to register vote" },
            { status: 500 },
        );
    }
}
