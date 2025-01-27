import { NextResponse } from "next/server";
import { checkCapacity } from "@/app/lib/data";

export async function POST(req: Request) {

    try{
        const { event_id } = await req.json();

        const response = await checkCapacity(event_id);
        if (!response.success) {
            return NextResponse.json({ success: false, error: response.error }, { status: 500 });
        }
        if (!response.spaceAvailable) {
            return NextResponse.json({ success: false, error: 'event capacity reached!' }, { status: 403 });
        }
    
        return NextResponse.json({ success: true, message: 'event has space.' }, { status: 200 });
    } catch(error) {
        console.error('There was an error checking capacity:', error.message);
        return NextResponse.json({ success: false, message: 'error checking capacity' }, { status: 500 });
    }
}
