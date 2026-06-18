/**
 * Auth helpers for the Society Intelligence Network admin API routes. Mirrors
 * the project's existing `auth()` + role-check pattern (see app/api/admin/*).
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
    id: string;
    role?: string;
    name?: string | null;
    email?: string | null;
};

export async function currentUser(): Promise<SessionUser | null> {
    const session = await auth();
    return session?.user ? (session.user as SessionUser) : null;
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
