import type { Metadata } from "next";
import { auth } from "@/auth";
import {
    getPublishedOpportunities,
    getSavedOpportunities,
    getSavedOpportunityIds,
} from "@/app/lib/opportunities/queries";
import { recommendForUser } from "@/app/lib/opportunities/recommendations";
import JobsBrowser from "@/app/components/jobs/jobs-browser";
import { MarketingCtas } from "@/app/components/jobs/marketing-ctas";

export const metadata: Metadata = {
    title: "Student Jobs & Opportunities | London Student Network",
    description:
        "Discover internships, graduate roles, placements and part-time work curated for London students. Save opportunities and apply — all in one beautiful place.",
    alternates: { canonical: "/jobs" },
};

// User-specific saved state — render dynamically.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
    search?: string;
    type?: string;
    location?: string;
    sort?: string;
}>;

export default async function JobsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const params = await searchParams;
    const session = await auth();
    const isLoggedIn = Boolean(session?.user);
    const userId = session?.user?.id;
    const verifiedUniversity =
        (session?.user as { verified_university?: string | null } | undefined)
            ?.verified_university ?? null;

    const [opportunities, savedIds, savedOpps] = await Promise.all([
        getPublishedOpportunities(),
        userId ? getSavedOpportunityIds(userId) : Promise.resolve([]),
        userId ? getSavedOpportunities(userId) : Promise.resolve([]),
    ]);

    // Personalized picks (empty until the user has saved something).
    const recommended = userId
        ? recommendForUser(opportunities, savedOpps, {
              verifiedUniversity,
              limit: 6,
          })
        : [];

    return (
        <main className="min-h-screen bg-[#041A2E] text-white">
            <JobsBrowser
                initialOpportunities={opportunities}
                savedIds={savedIds}
                isLoggedIn={isLoggedIn}
                recommended={recommended}
                initialFilters={{
                    search: params.search,
                    type: params.type,
                    locationType: params.location,
                    sort: params.sort,
                }}
            />
            <MarketingCtas />
        </main>
    );
}
