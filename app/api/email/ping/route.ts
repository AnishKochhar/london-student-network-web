import { sendUserEmail } from "@/app/lib/send-email";
import sgMail from "@sendgrid/mail";

export async function GET() {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    await sendUserEmail({
      toEmail: "hongleigu19@gmail.com",
      fromEmail: "helo@londonstudentnetwork.com",
      subject: "Ping from LSN API",
      text: "This is a ping to check if the email service is working correctly.",
    })
    return new Response("success", { status: 200 });
  } catch (err) {
    console.error("SendGrid error:", err.response?.body || err.message);
    return new Response("Failed", { status: 500 });
  }
}
