import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { getSavedOpportunities } from "@/app/lib/opportunities/queries";
import OpportunityCard from "@/app/components/jobs/opportunity-card";
import EmptyState from "@/app/components/jobs/empty-state";

export const metadata: Metadata = {
    title: "Saved opportunities | London Student Network",
    description: "Opportunities you've saved to come back to later.",
};

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/account/saved-jobs");
    }

    const saved = await getSavedOpportunities(session.user.id);

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] text-white">
            <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
                <Link
                    href="/account"
                    className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to account
                </Link>

                <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                        <BookmarkIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Saved opportunities
                        </h1>
                        <p className="text-sm text-white/60">
                            {saved.length > 0
                                ? `${saved.length} saved`
                                : "Nothing saved yet"}
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    {saved.length === 0 ? (
                        <EmptyState
                            title="No saved opportunities yet"
                            description="Save internships, jobs and student opportunities here so you can come back to them later."
                            icon={<BookmarkIcon className="h-7 w-7" />}
                            action={{ label: "Browse opportunities", href: "/jobs" }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {saved.map((o) => (
                                <OpportunityCard
                                    key={o.id}
                                    opportunity={o}
                                    saved
                                    isLoggedIn
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
