import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    fetchCategoriesWithCounts,
    createCategory,
    updateCategory,
    deleteCategory,
} from "@/app/lib/campaigns/queries";

// GET /api/admin/campaigns/categories - List categories with counts
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await fetchCategoriesWithCounts();

        // Build tree structure
        const rootCategories = categories.filter((c) => !c.parentId);
        const buildTree = (parent: typeof categories[0]): typeof categories[0] & { children: typeof categories } => ({
            ...parent,
            children: categories
                .filter((c) => c.parentId === parent.id)
                .map(buildTree),
        });

        const tree = rootCategories.map(buildTree);

        return NextResponse.json({ categories: tree });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// POST /api/admin/campaigns/categories - Create category
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const category = await createCategory({
            name: body.name,
            slug,
            parentId: body.parentId || null,
            color: body.color,
            icon: body.icon,
            description: body.description,
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);

        // Check for duplicate slug
        if (error instanceof Error && error.message.includes("unique")) {
            return NextResponse.json(
                { error: "A category with this slug already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/campaigns/categories - Update category
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        const category = await updateCategory(body.id, {
            name: body.name,
            slug: body.slug,
            parentId: body.parentId,
            color: body.color,
            icon: body.icon,
            description: body.description,
            sortOrder: body.sortOrder,
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/campaigns/categories - Delete category
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        await deleteCategory(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
