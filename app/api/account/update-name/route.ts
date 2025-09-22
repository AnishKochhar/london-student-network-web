import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

function smartCapitalize(name: string): string {
    if (!name) return name;

    // Split by spaces to handle each word
    return name.split(' ').map(word => {
        if (!word) return word;

        // Check if the word is already capitalized (has uppercase letters)
        const hasUppercase = /[A-Z]/.test(word);

        if (hasUppercase) {
            // If word already has uppercase letters, keep it as is
            return word;
        } else {
            // If word is all lowercase, capitalize first letter
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    }).join(' ');
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name } = await request.json();

        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { success: false, error: "Name is required and must be a string" },
                { status: 400 }
            );
        }

        // Trim and validate name length
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return NextResponse.json(
                { success: false, error: "Name cannot be empty" },
                { status: 400 }
            );
        }

        if (trimmedName.length > 100) {
            return NextResponse.json(
                { success: false, error: "Name is too long (max 100 characters)" },
                { status: 400 }
            );
        }

        // Apply smart capitalization
        const capitalizedName = smartCapitalize(trimmedName);

        // Update the user's name in the database
        await sql`
            UPDATE users
            SET name = ${capitalizedName}
            WHERE id = ${session.user.id}
        `;

        return NextResponse.json({
            success: true,
            name: capitalizedName
        });

    } catch (error) {
        console.error("Error updating user name:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update name" },
            { status: 500 }
        );
    }
}