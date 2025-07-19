import { checkEmail } from "@/app/lib/data"
import { NextResponse } from "next/server"

// exactly the same as /api/users/check-email, but is here for better organisation

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required' })
  }

  const response = await checkEmail(email)
  return NextResponse.json(response)

}