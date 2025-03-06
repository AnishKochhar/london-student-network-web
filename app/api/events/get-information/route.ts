import { fetchEventById } from "@/app/lib/data";
import { NextResponse } from "next/server";
import { Event } from "@/app/lib/types";

export async function POST(req: Request) {
	const { id }: { id: string } = await req.json();
	try {
		const result = await fetchEventById(id);
		if (result.success) return NextResponse.json(result.event);
		return NextResponse.json({ success: false, error: 'failed to retrieve an event by an id'}, { status: 500 });
	} catch(error) {
		return NextResponse.json({ success: false, error}, { status: 500 });
	}
}