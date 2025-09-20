import { insertContactForm } from "@/app/lib/data";
import { ContactFormInput } from "@/app/lib/types";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, message } = body as ContactFormInput;

        if (!name || !email || !message) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 },
            );
        }

        const result = await insertContactForm({
            id: "0",
            name,
            email,
            message,
        });

        if (result.success) {
            return NextResponse.json(
                { message: "Form submitted successfully" },
                { status: 200 },
            );
        } else {
            return NextResponse.json(
                { error: "Failed to submit form" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error handling form submission:", error);
        return NextResponse.json(
            { error: "Error processing form" },
            { status: 500 },
        );
    }
}
