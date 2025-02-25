import { NextResponse } from "next/server";
import { insertAccountId } from "@/app/lib/data";

export async function POST(req: Request) {
    try {
        const { userId, accountId } = await req.json();

        // Update the user record with the accountId in your database
        const response = await insertAccountId(userId, accountId);

        if (response.success) {
            return NextResponse.json({ success: true, message: 'accountId was succesfully stored.' }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: 'There was an error storing the accountId.' }, { status: 500 });
        }
        
    } catch (error) {
        console.error('Error storing account ID:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
