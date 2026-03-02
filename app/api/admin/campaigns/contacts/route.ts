import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    fetchContacts,
    createContact,
    updateContact,
    deleteContacts,
    importContacts,
} from "@/app/lib/campaigns/queries";
import { ContactStatus, ImportContact } from "@/app/lib/campaigns/types";

// GET /api/admin/campaigns/contacts - List contacts with pagination
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        const result = await fetchContacts({
            page: parseInt(searchParams.get("page") || "1"),
            limit: parseInt(searchParams.get("limit") || "50"),
            categoryId: searchParams.get("categoryId") || undefined,
            status: (searchParams.get("status") as ContactStatus) || undefined,
            search: searchParams.get("search") || undefined,
            sortBy: (searchParams.get("sortBy") as "name" | "email" | "createdAt" | "lastEmailedAt") || "createdAt",
            sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            { error: "Failed to fetch contacts" },
            { status: 500 }
        );
    }
}

// POST /api/admin/campaigns/contacts - Create contact(s)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Check if this is a bulk import
        if (body.contacts && Array.isArray(body.contacts)) {
            const result = await importContacts(
                body.contacts as ImportContact[],
                body.categoryId || null,
                body.source || "api_import"
            );
            return NextResponse.json(result);
        }

        // Single contact creation
        if (!body.email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const contact = await createContact({
            email: body.email,
            name: body.name,
            organization: body.organization,
            categoryId: body.categoryId,
            metadata: body.metadata,
            tags: body.tags,
            notes: body.notes,
            source: "manual",
        });

        return NextResponse.json(contact, { status: 201 });
    } catch (error) {
        console.error("Error creating contact:", error);

        // Check for duplicate email
        if (error instanceof Error && error.message.includes("unique")) {
            return NextResponse.json(
                { error: "A contact with this email already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create contact" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/campaigns/contacts - Update a contact
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: "Contact ID is required" },
                { status: 400 }
            );
        }

        const contact = await updateContact(body.id, {
            email: body.email,
            name: body.name,
            organization: body.organization,
            categoryId: body.categoryId,
            metadata: body.metadata,
            tags: body.tags,
            notes: body.notes,
            status: body.status,
        });

        return NextResponse.json(contact);
    } catch (error) {
        console.error("Error updating contact:", error);
        return NextResponse.json(
            { error: "Failed to update contact" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/campaigns/contacts - Delete contacts
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            return NextResponse.json(
                { error: "Contact IDs are required" },
                { status: 400 }
            );
        }

        const deletedCount = await deleteContacts(body.ids);

        return NextResponse.json({
            success: true,
            deletedCount,
        });
    } catch (error) {
        console.error("Error deleting contacts:", error);
        return NextResponse.json(
            { error: "Failed to delete contacts" },
            { status: 500 }
        );
    }
}
