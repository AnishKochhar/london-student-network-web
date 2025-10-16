import { insertOtherUser } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const data = await req.json();
    const response = await insertOtherUser(data);
    return NextResponse.json(response);
}
