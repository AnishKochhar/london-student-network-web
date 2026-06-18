/**
 * Small auth helpers for the opportunities API routes, matching the project's
 * existing inline `auth()` + role-check pattern (see app/api/admin/*).
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
    id: string;
    role?: string;
    name?: string | null;
    email?: string | null;
};

/** Current logged-in user, or null. */
export async function currentUser(): Promise<SessionUser | null> {
    const session = await auth();
    return session?.user ? (session.user as SessionUser) : null;
}

/** Returns a 401 response if not logged in, otherwise null. */
export function unauthorized(message = "You need to be signed in.") {
    return NextResponse.json(
        { error: message, requiresAuth: true },
        { status: 401 },
    );
}

/**
 * Guard for admin-only routes. Returns the admin user, or a NextResponse to
 * return immediately. Usage:
 *   const guard = await requireAdmin();
 *   if (guard instanceof NextResponse) return guard;
 */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
    const user = await currentUser();
    if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return user;
}
