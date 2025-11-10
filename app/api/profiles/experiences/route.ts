import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getExperiencesByUserId, insertExperience, deleteExperience } from "@/app/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const experiences = await getExperiencesByUserId(session.user.id);
    // Optional: sort by start_date descending
    experiences.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    return NextResponse.json({ success: true, experiences });
  } catch (err) {
    console.error("Error fetching experiences:", err);
    return NextResponse.json({ success: false, message: "Error fetching experiences" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { title, company, start_date, end_date, description } = await request.json();

  try {
    const experience = await insertExperience(session.user.id, {
      title,
      company,
      start_date,
      end_date,
      description,
    });

    if (!experience) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, experience });
  } catch (err) {
    console.error("Error adding experience:", err);
    return NextResponse.json({ success: false, message: "Error adding experience" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { experience_id } = await request.json();

  try {
    const deleted = await deleteExperience(session.user.id, experience_id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Experience not found or not yours" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting experience:", err);
    return NextResponse.json({ success: false, message: "Error deleting experience" }, { status: 500 });
  }
}
