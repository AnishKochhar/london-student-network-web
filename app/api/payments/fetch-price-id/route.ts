import { NextResponse } from "next/server";
import { fetchPriceId } from "@/app/lib/data";


export async function POST(request: Request){
    try {
        const { event_uuid } = await request.json();
        const response = await fetchPriceId(event_uuid);

        if (response.success) {
            return NextResponse.json({message: 'success', priceID: response.priceId}, {status: 200});
        } else {
            return NextResponse.json({message: 'failed to fetch price id for event'}, {status: 500});
        }
    } catch (error) {
        console.error('an error occured during trying to fetch price id:', error);
        return NextResponse.json({message: error.message}, {status: 500});
    }
}
