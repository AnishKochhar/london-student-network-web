import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    getPublishedSocieties,
    getPublishedSociety,
} from "@/app/lib/societies/queries";
import { similarSocieties } from "@/app/lib/societies/selectors";
import SocietyNetworkCard from "@/app/components/network/society-network-card";
import SocietyViewTracker from "@/app/components/network/society-view-tracker";
import TrackedLink from "@/app/components/network/tracked-link";
import {
    SOCIETY_TYPE_LABELS,
    type Society,
    type SocietyInteractionType,
} from "@/app/lib/societies/types";

export const dynamic = "force-dynamic";

type Params = { universitySlug: string; societySlug: string };

export async function generateMetadata({
    params,
}: {
    params: Promise<Params>;
}): Promise<Metadata> {
    const { universitySlug, societySlug } = await params;
    const society = await getPublishedSociety(universitySlug, societySlug);
    if (!society) return { title: "Society not found | LSN" };
    return {
        title: `${society.name} (${society.universityShortName}) | LSN Society Network`,
        description:
            society.shortDescription ??
            society.description?.slice(0, 155) ??
            `Discover ${society.name} at ${society.universityName} on London Student Network.`,
    };
}

function initials(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
}

const SOCIALS: {
    key: keyof Society;
    label: string;
    type: SocietyInteractionType;
}[] = [
    { key: "instagramUrl", label: "Instagram", type: "instagram_click" },
    { key: "tiktokUrl", label: "TikTok", type: "website_click" },
    { key: "linkedinUrl", label: "LinkedIn", type: "website_click" },
    { key: "linktreeUrl", label: "Links", type: "website_click" },
    { key: "websiteUrl", label: "Website", type: "website_click" },
];

export default async function SocietyProfilePage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { universitySlug, societySlug } = await params;
    const society = await getPublishedSociety(universitySlug, societySlug);
    if (!society) notFound();

    const all = await getPublishedSocieties();
    const similar = similarSocieties(society, all);

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580]">
            <SocietyViewTracker societyId={society.id} />
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                <Link
                    href="/network"
                    className="text-sm text-sky-300 hover:underline"
                >
                    ← All societies
                </Link>

                {/* Hero */}
                <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                        {society.logoUrl &&
                        /^https?:\/\//i.test(society.logoUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={society.logoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400/30 to-emerald-400/30 text-xl font-bold text-white">
                                {initials(society.name)}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-200">
                                {society.universityShortName}
                            </span>
                            <span className="text-xs text-white/50">
                                {society.category ??
                                    SOCIETY_TYPE_LABELS[society.type]}
                            </span>
                            {society.claimStatus === "unclaimed" && (
                                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                                    Unclaimed profile
                                </span>
                            )}
                        </div>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                            {society.name}
                        </h1>
                        <p className="text-sm text-blue-100/70">
                            {society.universityName}
                        </p>
                    </div>
                </header>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {society.membershipUrl && (
                        <TrackedLink
                            societyId={society.id}
                            type="membership_click"
                            href={society.membershipUrl}
                            className="rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300"
                        >
                            Join / membership
                        </TrackedLink>
                    )}
                    {society.suProfileUrl && (
                        <TrackedLink
                            societyId={society.id}
                            type="website_click"
                            href={society.suProfileUrl}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                        >
                            Official SU page
                        </TrackedLink>
                    )}
                    {SOCIALS.map(({ key, label, type }) => {
                        const url = society[key] as string | null;
                        if (!url) return null;
                        return (
                            <TrackedLink
                                key={key}
                                societyId={society.id}
                                type={type}
                                href={url}
                                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                            >
                                {label}
                            </TrackedLink>
                        );
                    })}
                </div>

                {/* Description */}
                {(society.description || society.shortDescription) && (
                    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
                            About
                        </h2>
                        <p className="whitespace-pre-line text-blue-50/90">
                            {society.description ?? society.shortDescription}
                        </p>
                        {(society.tags?.length ?? 0) > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {society.tags.map((t) => (
                                    <span
                                        key={t}
                                        className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/70"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Similar */}
                {similar.length > 0 && (
                    <section className="mt-10">
                        <h2 className="mb-4 text-lg font-semibold text-white">
                            Similar societies
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {similar.map((s) => (
                                <SocietyNetworkCard key={s.id} society={s} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Source disclaimer (spec §9.3) */}
                <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-white/50">
                    This profile is built from public and official sources to help
                    students discover societies. Society details may change — check
                    official links before joining or attending events.
                </p>
            </div>
        </main>
    );
}
