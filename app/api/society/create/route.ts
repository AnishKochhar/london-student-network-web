import {
    insertOrganiserInformation,
    insertOrganiserIntoUsers,
} from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const data = await req.json();
    const response = await insertOrganiserIntoUsers(data);
    if (response.success) {
        const id = response.id as string;
        const response_two = await insertOrganiserInformation(data, id);
        return NextResponse.json(response_two);
    }
    return NextResponse.json(response);
}
