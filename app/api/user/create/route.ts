import { insertUser, insertUserInformation } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const data = await req.json();
    const response = await insertUser(data);
    if (response.success) {
        const id = response.id as string;
        const response_two = await insertUserInformation(data, id);

        // Ensure the ID is included in the response
        return NextResponse.json({
            ...response_two,
            id: id  // Always include the user ID in the response
        });
    }
    return NextResponse.json(response);
}
