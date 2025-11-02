import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const threadId = parseInt(params.id, 10);

        if (isNaN(threadId)) {
            return NextResponse.json(
                { success: false, error: "Invalid thread ID" },
                { status: 400 }
            );
        }

        // Get current user session to determine their vote status
        const session = await auth();
        const userId = session?.user?.id;

        // Fetch the thread with author info and vote counts
        const threadQuery = `
            SELECT
                t.id,
                t.title,
                t.content,
                t.created_at,
                t.author_id,
                u.forum_username as author,
                u.name as author_name,
                t.tags,
                COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 ELSE 0 END), 0)::int as upvotes,
                COALESCE(SUM(CASE WHEN v.vote_type = 'downvote' THEN 1 ELSE 0 END), 0)::int as downvotes,
                (
                    SELECT COUNT(*)::int
                    FROM forum_replies
                    WHERE thread_id = t.id AND parent_id IS NULL
                ) as reply_count,
                ${userId ? `(SELECT vote_type FROM forum_votes WHERE thread_id = t.id AND user_id = $2) as user_vote,` : "NULL as user_vote,"}
                t.updated_at,
                CASE
                    WHEN t.updated_at > t.created_at THEN true
                    ELSE false
                END as was_edited
            FROM forum_threads t
            LEFT JOIN users u ON t.author_id = u.id
            LEFT JOIN forum_votes v ON t.id = v.thread_id
            WHERE t.id = $1
            GROUP BY t.id, u.forum_username, u.name
        `;

        const threadResult = userId
            ? await sql.query(threadQuery, [threadId, userId])
            : await sql.query(threadQuery, [threadId]);

        if (threadResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Thread not found" },
                { status: 404 }
            );
        }

        const thread = threadResult.rows[0];

        // Format the response
        const formattedThread = {
            id: thread.id,
            title: thread.title,
            content: thread.content,
            author: thread.author || thread.author_name?.split(" ").map((n: string) => n[0]).join("") || "U",
            authorId: thread.author_id,
            avatar: thread.author_name?.split(" ").map((n: string) => n[0]?.toUpperCase() || "").slice(0, 2).join("") || "U",
            timeAgo: getTimeAgo(new Date(thread.created_at)),
            upvotes: thread.upvotes,
            downvotes: thread.downvotes,
            replyCount: thread.reply_count,
            tags: Array.isArray(thread.tags) ? thread.tags : [],
            userVote: thread.user_vote || null,
            wasEdited: thread.was_edited,
            editedTimeAgo: thread.was_edited ? getTimeAgo(new Date(thread.updated_at)) : null,
            replies: [], // Will be loaded separately if needed
        };

        return NextResponse.json({
            success: true,
            thread: formattedThread,
        });
    } catch (error) {
        console.error("Error fetching thread:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
        }
    }

    return "just now";
}
