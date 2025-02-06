import { NextResponse } from "next/server";
import { addMatchToDatabase, fetchAttendeeDetails } from "@/app/lib/data";
import { sendSpeedDatingMatchEmail } from "@/app/lib/send-email";

export async function POST(req: Request) {
	try {
		const { from, to } = await req.json();

		if (!from || !to) {
			return NextResponse.json(
				{ success: false, error: "Missing IDs." },
				{ status: 400 }
			);
		}
		if (isNaN(Number(from)) || isNaN(Number(to))) {
			return NextResponse.json(
				{ success: false, error: "IDs must be numeric." },
				{ status: 400 }
			);
		}

		// Fetch details from dating_attendees table
		const fromDetails = await fetchAttendeeDetails(from);
		const toDetails = await fetchAttendeeDetails(to);
		if (!fromDetails || !toDetails) {
			return NextResponse.json(
				{ success: false, error: "One or both IDs not found." },
				{ status: 404 }
			);
		}

		// Send the match email
		await sendSpeedDatingMatchEmail({
			toEmail: toDetails.email,
			fromEmail: fromDetails.email,
			toName: toDetails.name,
			fromName: fromDetails.name,
			toID: to,
			fromID: from,
		});

		await addMatchToDatabase(from, to, fromDetails.name, toDetails.name)

		return NextResponse.json({
			success: true,
			from: { id: from, name: fromDetails.name, email: fromDetails.email },
			to: { id: to, name: toDetails.name, email: toDetails.email },
		});
	} catch (error) {
		console.error("Error in add-match route:", error);
		return NextResponse.json(
			{ success: false, error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
