import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAvatarInitials } from "@/app/lib/forum-utils";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        // Rate limiting for replies (stricter limits)
        const identifier = getRateLimitIdentifier(request);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.registration);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        const session = await auth();

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "You must be logged in to reply" },
                { status: 401 },
            );
        }

        const userId = session.user.id;
        const { threadId, content, parentId = null } = await request.json();

        // Validate input
        if (!threadId || !content || content.trim() === "") {
            return NextResponse.json(
                { error: "Thread ID and content are required" },
                { status: 400 },
            );
        }

        try {
            // Begin transaction
            await sql`BEGIN`;

            // Insert the comment
            const commentResult = await sql`
        INSERT INTO comments (thread_id, parent_id, author_id, content, upvotes, downvotes, created_at, updated_at)
        VALUES (${threadId}, ${parentId}, ${userId}, ${content}, 0, 0, NOW(), NOW())
        RETURNING id, created_at, parent_id
      `;

            const commentId = commentResult.rows[0].id;
            const createdAt = commentResult.rows[0].created_at;
            const parentCommentId = commentResult.rows[0].parent_id;

            // Commit transaction
            await sql`COMMIT`;

            // Get the author name and username
            const userResult = await sql`
        SELECT u.name, un.username
        FROM users u
        LEFT JOIN usernames un ON u.id = un.user_id
        WHERE u.id = ${userId}
      `;

            const authorName = userResult.rows[0]?.name || "Anonymous";
            const username = userResult.rows[0]?.username || authorName;

            // Return the newly created comment
            return NextResponse.json({
                id: commentId,
                thread_id: threadId,
                parent_id: parentCommentId,
                content,
                author: username,  // Use username instead of real name
                authorName: authorName,  // Keep real name for reference
                authorId: userId,
                avatar: getAvatarInitials(username),  // Generate avatar from username
                timeAgo: "just now",
                upvotes: 0,
                downvotes: 0,
                userVote: null,
                created_at: createdAt,
                replyCount: 0,
                hasReplies: false,
            });
        } catch (error) {
            // Rollback on error
            await sql`ROLLBACK`;
            console.error("Error creating comment:", error);
            throw error;
        }
    } catch (error) {
        console.error("Error handling comment creation:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 },
        );
    }
}
