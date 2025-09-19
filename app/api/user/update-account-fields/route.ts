import { updateAccountInfo } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { id, data } = await req.json();
    const response = await updateAccountInfo(id, data);
    return NextResponse.json(response);
}
