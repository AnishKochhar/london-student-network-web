import { NextResponse } from "next/server";
import { checkIfRegistered, fetchOrganiserEmailFromEventId, fetchRegistrationEmailEventInformation, registerForEvent } from "@/app/lib/data";
import { sendOrganiserRegistrationEmail, sendUserRegistrationEmail } from "@/app/lib/send-email";

export async function POST(req: Request) {
	const { event_id, user_information } = await req.json();
	const user: { email: string, id: string, name: string } = user_information
	const alreadyRegistered = await checkIfRegistered(event_id, user.id)
	if (alreadyRegistered) {
		return NextResponse.json({ success: false, registered: true })
	}
	// const response = await checkCapacity(event_id);
	// if (!response.success) {
	// 	return NextResponse.json({ success: false, error: response.error })
	// }
	// if (!response.spaceAvailable) {
	// 	return NextResponse.json({ success: false, error: 'event capacity reached!' })
	// }

	const registrationResponse = await registerForEvent(user.id, user.email, user.name, event_id)
	if (registrationResponse.success) {
		// Send confirmation email to user
		const eventInformationResponse = await fetchRegistrationEmailEventInformation(event_id);
		if (!eventInformationResponse.success) {
			return NextResponse.json({ success: false, emailError: true })
		}
		await sendUserRegistrationEmail(user.email, eventInformationResponse.event)
		// Send confirmation email to organiser
		const organiserEmailResponse = await fetchOrganiserEmailFromEventId(event_id)
		if (!organiserEmailResponse) {
			return NextResponse.json({ success: false, emailError: true })
		}
		await sendOrganiserRegistrationEmail(organiserEmailResponse.email, user.email, user.name, eventInformationResponse.event.title)
	}
	return NextResponse.json(registrationResponse)
}