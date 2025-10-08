import { fetchEventById } from "@/app/lib/data";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { id }: { id: string } = await req.json();
        const event = await fetchEventById(id);

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Check visibility permissions
        const session = await auth();
        const visibilityLevel = event.visibility_level || 'public';
        const userVerifiedUniversity = session?.user?.verified_university;
        const isLoggedIn = !!session?.user;

        let hasAccess = false;

        if (visibilityLevel === 'public' || !visibilityLevel) {
            hasAccess = true;
        } else if (visibilityLevel === 'students_only') {
            hasAccess = isLoggedIn;
        } else if (visibilityLevel === 'verified_students') {
            hasAccess = !!userVerifiedUniversity;
        } else if (visibilityLevel === 'university_exclusive') {
            const allowedUniversities = event.allowed_universities || [];
            hasAccess = !!userVerifiedUniversity && allowedUniversities.includes(userVerifiedUniversity);
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: "Access denied: You don't have permission to view this event" },
                { status: 403 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Failed to fetch event" },
            { status: 500 }
        );
    }
}
