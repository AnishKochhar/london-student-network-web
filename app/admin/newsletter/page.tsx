"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import NewsletterDashboard from "@/app/components/admin/newsletter/dashboard";

export default async function NewsletterAdminPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user?.role !== "admin") {
        redirect("/account");
    }

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="w-full px-6 py-8">
                <NewsletterDashboard />
            </div>
        </main>
    );
}
