"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "../components/admin/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check authentication at layout level
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/admin");
    }

    if (session.user?.role !== "admin") {
        redirect("/account");
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Sidebar */}
            <AdminSidebar user={session.user} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
