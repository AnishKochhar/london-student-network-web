import type { Metadata } from "next";
import NetworkDirectory from "@/app/components/network/network-directory";
import {
    getPublishedSocieties,
    listUniversities,
} from "@/app/lib/societies/queries";
import { collectCategories, collectTypes } from "@/app/lib/societies/selectors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Society Network — discover London student societies | LSN",
    description:
        "Discover student societies across King's, UCL, LSE, Imperial and Queen Mary. Built from public and official sources to help students find their people.",
};

export default async function NetworkPage() {
    const [societies, universities] = await Promise.all([
        getPublishedSocieties(),
        listUniversities(),
    ]);

    const uniOptions = universities
        .filter((u) => societies.some((s) => s.universityId === u.id))
        .map((u) => ({ id: u.id, shortName: u.shortName }));

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580]">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
                {/* Hero */}
                <header className="mb-10 max-w-2xl">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-sky-300">
                        Society Network
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Find your people across London.
                    </h1>
                    <p className="mt-4 text-lg text-blue-100/80">
                        Discover societies from King&apos;s, UCL, LSE, Imperial and
                        Queen Mary — all in one place. Search, filter and explore{" "}
                        {societies.length} student-led communities.
                    </p>
                </header>

                <NetworkDirectory
                    societies={societies}
                    universities={uniOptions}
                    categories={collectCategories(societies)}
                    types={collectTypes(societies)}
                />

                {/* Internal-only claim CTA (no outbound; disabled for now). */}
                <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                    <h2 className="text-lg font-semibold text-white">
                        Run one of these societies?
                    </h2>
                    <p className="mx-auto mt-1 max-w-xl text-sm text-blue-100/70">
                        Claiming your profile is coming soon. These profiles are
                        built from public and official sources to help students
                        discover you.
                    </p>
                    <button
                        disabled
                        className="mt-4 cursor-not-allowed rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/50"
                    >
                        Claim your society (coming soon)
                    </button>
                </div>
            </div>
        </main>
    );
}
