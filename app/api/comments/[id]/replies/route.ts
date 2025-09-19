import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    formatContent,
    getTimeAgo,
    getAvatarInitials,
} from "@/app/lib/forum-utils";

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const commentId = params.id;
        const session = await auth();
        const userId = session?.user?.id;

        // Fetch replies for the comment
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
      WHERE c.parent_id = ${commentId}
      ORDER BY c.created_at ASC
    `;

        // Format the replies
        const replies = await Promise.all(
            repliesResult.rows.map(async (reply) => {
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

                // Check if this comment has any replies and get the count
                const repliesCount = await sql`
        SELECT COUNT(*) as count
        FROM comments
        WHERE parent_id = ${reply.id}
      `;

                const replyCount = parseInt(repliesCount.rows[0].count);
                const hasReplies = replyCount > 0;
                const authorName = reply.author_name || "Anonymous";

                const wasEdited =
                    new Date(reply.updated_at) > new Date(reply.created_at);

                return {
                    id: reply.id,
                    thread_id: reply.thread_id,
                    parent_id: reply.parent_id,
                    content: formatContent(reply.content),
                    author: authorName,
                    authorId: reply.author_id,
                    avatar: getAvatarInitials(authorName),
                    timeAgo: getTimeAgo(reply.created_at),
                    upvotes: reply.upvotes || 0,
                    downvotes: reply.downvotes || 0,
                    userVote,
                    hasReplies,
                    replyCount,
                    wasEdited,
                    editedTimeAgo: wasEdited
                        ? getTimeAgo(reply.updated_at)
                        : undefined,
                };
            }),
        );

        return NextResponse.json(replies);
    } catch (error) {
        console.error("Error fetching comment replies:", error);
        return NextResponse.json(
            { error: "Failed to fetch comment replies" },
            { status: 500 },
        );
    }
}
