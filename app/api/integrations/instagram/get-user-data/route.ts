// import { storeInstagramToken, addUserToPollingList } from "@/lib/redis-helpers"
import { getInstagramUserData } from "@/app/lib/redis-helpers"
// import { auth } from "@/auth"
import { NextResponse } from "next/server";

export async function GET() {
//   try {
//     const session = await auth();
//     if (!session?.user?.id || session?.user?.id?.length === 0) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     if (session.user?.role !== "organiser") {
//         return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }
//     const data = await getInstagramUserData(session.user.id)
//     console.log(data);
//     return NextResponse.json(data, { status: 200 })
//   } catch (error) {
//     console.error("Couldn't get instagram user data:", error)
//     return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
//   }
  return NextResponse.json({sucess: true})
}
