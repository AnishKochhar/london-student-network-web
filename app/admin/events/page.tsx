"use server";

import EventList from "@/app/components/admin/events-list";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import { Button } from "@/app/components/button";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

export default async function AdminEventsPage() {
    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Events Management"
                description="View, manage, and remove event listings across the platform"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Events" },
                ]}
                actions={
                    <Link href="/events/create">
                        <Button
                            variant="filled"
                            size="md"
                            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Create Event
                        </Button>
                    </Link>
                }
            />

            <div className="p-6 sm:p-8">
                <EventList />
            </div>
        </div>
    );
}
