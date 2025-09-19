import { fetchBase16ConvertedEventWithUserId } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { id, user_id }: { id: string; user_id: string } = await req.json();
    console.log("data", id, user_id);
    const res = await fetchBase16ConvertedEventWithUserId(id, user_id);
    return NextResponse.json(res);
}
