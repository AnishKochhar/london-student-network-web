import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user's forum posts (threads and replies)
        const threadsResult = await sql`
            SELECT
                t.id,
                t.title,
                t.content,
                t.upvotes,
                t.downvotes,
                t.created_at,
                t.updated_at,
                u.username,
                (SELECT COUNT(*) FROM comments WHERE thread_id = t.id) as reply_count,
                (t.upvotes - t.downvotes) as score,
                ARRAY(
                    SELECT ft.name
                    FROM thread_tags tt
                    JOIN forum_tags ft ON tt.forum_tag_id = ft.id
                    WHERE tt.thread_id = t.id
                ) as tags
            FROM threads t
            JOIN usernames u ON t.author_id = u.user_id
            WHERE t.author_id = ${session.user.id}
            ORDER BY t.created_at DESC
        `;

        // Get user's replies (comments)
        const repliesResult = await sql`
            SELECT
                c.id,
                c.content,
                c.thread_id,
                c.parent_id as parent_reply_id,
                c.created_at,
                c.updated_at,
                t.title as thread_title,
                u.username,
                c.upvotes as like_count,
                EXISTS(SELECT 1 FROM comments_votes WHERE comment_id = c.id AND user_id = ${session.user.id} AND vote_type = 'up') as is_liked
            FROM comments c
            JOIN threads t ON c.thread_id = t.id
            JOIN usernames u ON c.author_id = u.user_id
            WHERE c.author_id = ${session.user.id}
            ORDER BY c.created_at DESC
        `;

        return NextResponse.json({
            threads: threadsResult.rows,
            replies: repliesResult.rows,
            threadCount: threadsResult.rows.length,
            replyCount: repliesResult.rows.length
        });

    } catch (error) {
        console.error("Error fetching user forum posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch forum posts" },
            { status: 500 }
        );
    }
}