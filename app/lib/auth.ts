import { auth } from "@/auth";

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role?: string;
}

export async function requireAuth(): Promise<AuthenticatedUser> {
    const session = await auth();

    if (!session?.user) {
        throw new Error("UNAUTHORIZED");
    }

    return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "",
        role: session.user.role
    };
}

export async function requireRole(requiredRole: string): Promise<AuthenticatedUser> {
    const user = await requireAuth();

    if (user.role !== requiredRole) {
        throw new Error("FORBIDDEN");
    }

    return user;
}

export function createAuthErrorResponse(error: Error) {
    switch (error.message) {
        case "UNAUTHORIZED":
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        case "FORBIDDEN":
            return Response.json(
                { success: false, error: "Insufficient permissions" },
                { status: 403 }
            );
        default:
            return Response.json(
                { success: false, error: "Authentication error" },
                { status: 401 }
            );
    }
}