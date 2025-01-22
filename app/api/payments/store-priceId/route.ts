import { NextResponse } from "next/server";
import { insertIntoTickets } from "@/app/lib/data";


export async function POST(request: Request){
    try {
        const { tickets_price, priceId, event_uuid } = await request.json();
        const response = await insertIntoTickets(tickets_price, event_uuid, priceId);

        if (response.success) {
            return NextResponse.json({message: 'success'}, {status: 200});
        } else {
            return NextResponse.json({message: 'failed to insert price of ticket into database'}, {status: 500});
        }
    } catch (error) {
        console.error('an error occured during trying to save priceId:', error);
        return NextResponse.json({message: error.message}, {status: 500});
    }
}
