import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { TrendingTopic } from "@/app/lib/types";

export async function GET() {
    try {
        const trendingTopics = await sql<TrendingTopic>`
      SELECT ft.name, COUNT(tt.id) as count
      FROM forum_tags ft
      JOIN thread_tags tt ON ft.id = tt.forum_tag_id
      GROUP BY ft.name
      ORDER BY count DESC
      LIMIT 5;
    `;

        return NextResponse.json(trendingTopics.rows);
    } catch (error) {
        console.error("Error fetching trending topics:", error);
        return NextResponse.json(
            { error: "Failed to fetch trending topics" },
            { status: 500 },
        );
    }
}
