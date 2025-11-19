import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProfileByUserId, insertProfile, updateProfile } from "@/app/lib/profiles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    let profile = await getProfileByUserId(session.user.id);

    // If no profile exists, create a bare profile
    if (!profile) {
      profile = await insertProfile(session.user.id);
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const data = await request.json();

  try {
    // Update the profile with the provided fields
    const profile = await updateProfile(session.user.id, {
      headline: data.headline,
      bio: data.bio,
      location: data.location,
      phone: data.phone,
      linkedin_url: data.linkedin_url,
      github_url: data.github_url,
      portfolio_url: data.portfolio_url,
      resume_url: data.resume_url,
      profile_picture_url: data.profile_picture_url,
      banner_image_url: data.banner_image_url,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("Error saving profile:", err);
    return NextResponse.json(
      { success: false, message: "Error saving profile" },
      { status: 500 }
    );
  }
}
