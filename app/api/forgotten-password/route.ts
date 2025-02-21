import { sendResetPasswordEmail } from "@/app/lib/send-email";
import { NextResponse, NextRequest } from "next/server";
import { insertToken } from '@/app/lib/data';
import { generateToken } from "@/app/lib/utils/general";

// Reset a password from an email
export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json() ;

		if (!email) {
			console.error('Error with the server, could not extract user email');
			return NextResponse.json({ error: "Failed to extract user email" }, { status: 500 });
		}

		const token = generateToken(); // Generates token

		const response = await insertToken(email, token, 'reset'); // Inserts token into redis. Third parameter, 'purpose', is 'reset' or 'verify'

		if (!response.success) {
			console.log('Failed to insert token into redis');
			throw new Error('Failed to insert token into redis');
		}

		await sendResetPasswordEmail(email, token);

		return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
	} catch (error) {
		console.error('[POST] Error while sending email:', error);
		return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
	}
}
