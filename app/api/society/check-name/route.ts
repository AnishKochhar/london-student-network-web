import { checkSocietyName } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { name } = await req.json();

    if (!name) {
        return NextResponse.json({ success: false, error: "Name is required" });
    }

    const response = await checkSocietyName(name);
    return NextResponse.json(response);
}
