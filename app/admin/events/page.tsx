"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from 'next/link';
import { Button } from '@/app/components/button';
import EventList from '../../components/admin/events-list';

export default async function AdminEventsPage() {
    const session = await auth();
    if (!session) {
        redirect("/login?callbackUrl=/admin/events");
    }

    if (session.user?.role !== "admin") {
        redirect("/account");
    }

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Event Management
                        </h1>
                        <p className="text-gray-300">
                            View all event listings, remove listings, and manage events
                        </p>
                    </div>
                    <Link href="/admin">
                        <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                            ← Back to Admin
                        </Button>
                    </Link>
                </div>

                {/* Event List */}
                <EventList />
            </div>
        </main>
    );
}
