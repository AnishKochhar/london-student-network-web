import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSkillsByUserId, insertSkill, deleteSkill } from "@/app/lib/profiles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const skills = await getSkillsByUserId(session.user.id);
    return NextResponse.json({ success: true, skills });
  } catch (err) {
    console.error("Error fetching skills:", err);
    return NextResponse.json({ success: false, message: "Error fetching skills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { skill_name } = await request.json();

  try {
    const skill = await insertSkill(session.user.id, skill_name);
    if (!skill) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, skill });
  } catch (err) {
    console.error("Error adding skill:", err);
    return NextResponse.json({ success: false, message: "Error adding skill" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { skill_id } = await request.json();

  try {
    const deleted = await deleteSkill(session.user.id, skill_id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Skill not found or not yours" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting skill:", err);
    return NextResponse.json({ success: false, message: "Error deleting skill" }, { status: 500 });
  }
}
