import { NextResponse } from "next/server";
import { checkIfRegistered, fetchSQLEventById, getUserUniversityById, registerForEvent } from "@/app/lib/data";

export async function POST(req: Request) {
	const { event_id, user_information } = await req.json();
	const user: { email: string, id: string, name: string } = user_information
	// step1: find the user
	const userUniversity = await getUserUniversityById(user.id)
	if (!userUniversity.success) {
		return NextResponse.json({success: false, error: userUniversity.error})
	}
	const event = await fetchSQLEventById(event_id)
	const eventOrganiser = event.organiser_uid
	const eventOrganiserUniversity = await getUserUniversityById(eventOrganiser)
	if (!eventOrganiserUniversity.success) {
		return NextResponse.json({success: false, error: eventOrganiserUniversity.error})
	}
	const alreadyRegistered = await checkIfRegistered(event_id, user.id)
	if (alreadyRegistered) {
		return NextResponse.json({ success: false, registered: true })
	}
	console.log("Universities", userUniversity, eventOrganiserUniversity)
	const response = await registerForEvent(user.id, user.email, user.name, event_id, userUniversity.university != eventOrganiserUniversity.university)
	return NextResponse.json(response)
}