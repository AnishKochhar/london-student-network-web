import { NextResponse } from "next/server";
import { fetchAccountId } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { user_id } = await request.json();
        if (!user_id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const response = await fetchAccountId(user_id);
        if (!response.success) {
            return NextResponse.json({ success: false }, { status: 500 });
        }
        if (!response.accountId) {
            return NextResponse.json({ success: false }, { status: 200 });
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user events:', error);
        return NextResponse.json({ error: 'Failed to fetch user events' }, { status: 500 });
    }
}
