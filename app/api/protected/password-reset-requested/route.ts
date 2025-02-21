// import { sendResetPasswordEmail } from "@/app/lib/send-email";
import { NextResponse } from "next/server";
// import { insertToken, findUniqueForgottenPasswordEmails, cleanupForgottenPasswordEmails } from '@/app/lib/data';
// import { generateToken } from "@/app/lib/utils/general";

// // Reset a password from an email
export async function POST() {
// 	try {
        // try{ 
        //     const session = await getSession(); 
        //     // check if the user is an admin
        //     if (!session || session.user.email !== 'admin@lsn.co.uk') {
        //         return NextResponse.json(
        //             { error: "Unauthorized: You do not have permission to access this resource" },
        //             { status: 403 } // 403 Forbidden
        //         );
        //     }
        // } catch (error) {
        //     console.error('Error fetching session:', error);
        //     return NextResponse.json({ error: "Failed to authenticate" }, { status: 401 }); // 401 Unauthorized
        // }

		// const emails = await findUniqueForgottenPasswordEmails(); // Fetches unique emails from db
        // console.log('Unique emails:', emails);

		// if (!emails || emails.length === 0) {
		// 	console.error('Error with the server, could not extract emails requesting password reset');
		// 	return NextResponse.json({ error: "No password reset request messages found in db" }, { status: 500 });
		// }

        // const promises = emails.map(async (emailObj) => {
        //     try {
        //         const token = generateToken(emailObj.email); // Generates token
        //         const response = await insertToken(emailObj.email, token, 'reset', 259200); // Inserts token into redis, with 3 day expiry

        //         if (!response.success) {
        //             console.error(`Failed to insert token into redis for email: ${emailObj.email}`);
        //             return { success: false, email: emailObj.email, error: "Failed to insert token" }; // Return failure info
        //         }

        //         await sendResetPasswordEmail(emailObj.email, token);
        //         return { success: true, email: emailObj.email };
        //     } catch (error) {
        //         console.error(`Error processing password reset for email ${emailObj.email}:`, error);
        //         return { success: false, email: emailObj.email, error: error.message }; // Return failure info with error message
        //     }
        // });

		// const results = await Promise.all(promises);

		// if (results.some(result => !result.success)) {
		// 	console.error('Error while processing password reset requests:', results);
		// 	return NextResponse.json({ error: "Failed to send email to some users", results }, { status: 500 });
		// }

//         const cleanup = await cleanupForgottenPasswordEmails(); // Clean up the db, delete the relevant contacts

//         if (!cleanup.success) {
//             console.error('Failed to clean up forgotten password emails:', cleanup.error);
//             return NextResponse.json({ message: "Failed to clean up forgotten password emails" }, { status: 200 }); // we still sent the emails
//         }

// 		return NextResponse.json({ message: "Emails sent successfully" }, { status: 200 });
// 	} catch (error) {
// 		console.error('[POST] Error while sending emails:', error);
		return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
// 	}
}
