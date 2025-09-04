import { sendEmailVerificationEmail } from "@/app/lib/send-email";
import { NextResponse, NextRequest } from "next/server";
import { insertToken } from '@/app/lib/redis-operations';
import { generateToken } from '@/app/lib/utils';

// Verify an email
export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

        if (!email) {
            console.error('Missing email in request body');
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 }); // 400 Bad Request
        }

		const token = generateToken(); // Generates token 

        const response = await insertToken(email, token, 'verify'); // Inserts token into redis

        if (!response.success) {
            console.log('Failed to insert token into redis');
            throw new Error('Failed to insert token into redis');
        }

		const verificationEmailResponse = await sendEmailVerificationEmail(email, token);
		if (!verificationEmailResponse.success) {
			return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 }); // 500 Internal Server Error
		}

		return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 });
	} catch (error) {
		console.error('[POST] Error while sending email:', error);
		return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 }); // 500 Internal Server Error
	}
}
