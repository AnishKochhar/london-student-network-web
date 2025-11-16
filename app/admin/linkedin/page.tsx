"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/app/components/button";
import Link from "next/link";
import LinkedInPostApprover from "@/app/components/admin/linkedin-post-approver";

export default async function LinkedInAdminPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    if (session.user?.role !== "admin") {
        redirect("/account");
    }

    return (
        <main className="relative h-full max-auto pt-8 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] min-h-screen">
            <div className="flex flex-col h-full justify-center items-center p-6">
                <div className="flex flex-row items-start justify-between w-full">
                    <h1 className="text-2xl md:text-4xl text-white">LinkedIn Post Manager</h1>
                    <Button
                        variant="outline"
                        size="lg"
                        className="text-white border-gray-100"
                    >
                        <Link href="/admin" replace>
                            Back to Admin
                        </Link>
                    </Button>
                </div>
                <p className="p-6 text-white text-center max-w-2xl">
                    Review and approve LinkedIn posts before they&apos;re published.
                    After 5 successful approvals, the system will switch to auto-approval.
                </p>
                <LinkedInPostApprover />
            </div>
        </main>
    );
}
