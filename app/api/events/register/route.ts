import { NextResponse } from "next/server";
import { checkIfRegistered, registerForEvent } from "@/app/lib/data";

export async function POST(req: Request) {
	const { event_id, user_information } = await req.json();
	const user: { email: string, id: string, name: string } = user_information
	const alreadyRegistered = await checkIfRegistered(event_id, user.id)
	if (alreadyRegistered) {
		return NextResponse.json({ success: false, registered: true })
	}
	const response = await registerForEvent(user.id, user.email, user.name, event_id)
	return NextResponse.json(response)
}
