import { NextResponse } from "next/server";
import { createFormToken } from "@/app/lib/spam-protection";

export async function GET() {
    const token = createFormToken();
    return NextResponse.json({ token });
}
