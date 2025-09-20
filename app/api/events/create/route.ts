import { insertModernEvent } from "@/app/lib/data";
import { NextResponse } from "next/server";
import { createSQLEventData } from "@/app/lib/utils";
import { EventFormData } from "@/app/lib/types";

export async function POST(req: Request) {
	try {
		const data: EventFormData = await req.json();

		// Validate required fields
		if (!data.title || !data.description || !data.organiser || !data.start_datetime || !data.end_datetime) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Validate optional email field if provided
		if (data.external_forward_email && data.external_forward_email.trim() !== '') {
			const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
			if (!emailRegex.test(data.external_forward_email.trim())) {
				return NextResponse.json(
					{ success: false, error: "Invalid email format for external forward email" },
					{ status: 400 }
				);
			}
		}

		// Convert form data to SQL format
		const sqlEventData = createSQLEventData(data);

		// Insert into database
		const response = await insertModernEvent(sqlEventData);

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error creating event:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
