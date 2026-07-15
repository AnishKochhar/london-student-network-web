import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    AcademicCapIcon,
    GiftIcon,
    MapPinIcon,
    BanknotesIcon,
} from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import {
    getOpportunityBySlug,
    getPublishedOpportunities,
    getSavedOpportunityIds,
} from "@/app/lib/opportunities/queries";
import type { Opportunity } from "@/app/lib/opportunities/types";
import { avatarGradient, initials } from "@/app/components/jobs/format";
import TypeBadge from "@/app/components/jobs/type-badge";
import DeadlineBadge from "@/app/components/jobs/deadline-badge";
import OpportunityCard from "@/app/components/jobs/opportunity-card";
import ViewTracker from "@/app/components/jobs/view-tracker";
import StickyApplyPanel from "@/app/components/jobs/detail/sticky-apply-panel";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";
import { cn } from "@/app/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { slug } = await params;
    const o = await getOpportunityBySlug(slug);
    if (!o) return { title: "Opportunity not found | LSN Jobs" };
    return {
        title: `${o.title} — ${o.organisation} | LSN Jobs`,
        description: o.summary ?? `${o.title} at ${o.organisation}.`,
        alternates: { canonical: `/jobs/${o.slug}` },
    };
}

export default async function OpportunityDetailPage({
    params,
}: {
    params: Params;
}) {
    const { slug } = await params;
    const o = await getOpportunityBySlug(slug);
    if (!o) notFound();

    const session = await auth();
    const isLoggedIn = Boolean(session?.user);
    const savedIds = session?.user?.id
        ? await getSavedOpportunityIds(session.user.id)
        : [];
    const isSaved = savedIds.includes(o.id);

    const related = await getRelated(o);
    const savedSet = new Set(savedIds);
    const returnTo = `/jobs/${o.slug}`;

    return (
        <main className="min-h-screen bg-[#041A2E] text-white">
            <ViewTracker opportunityId={o.id} />

            <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to opportunities
                </Link>

                <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="lg:col-span-2">
                        <div className="flex items-start gap-4">
                            <div
                                className={cn(
                                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-inner",
                                    avatarGradient(o.organisation),
                                )}
                            >
                                {initials(o.organisation)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-medium text-white/60">
                                    {o.organisation}
                                </p>
                                <h1 className="mt-1 text-3xl font-bold leading-tight text-white sm:text-4xl">
                                    {o.title}
                                </h1>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <TypeBadge type={o.type} />
                            <DeadlineBadge deadline={o.deadline} />
                            {o.location && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/70 ring-1 ring-inset ring-white/10">
                                    <MapPinIcon className="h-3.5 w-3.5" />
                                    {o.location}
                                </span>
                            )}
                            {o.salaryText && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/70 ring-1 ring-inset ring-white/10">
                                    <BanknotesIcon className="h-3.5 w-3.5" />
                                    {o.salaryText}
                                </span>
                            )}
                        </div>

                        {o.summary && (
                            <p className="mt-6 text-lg leading-relaxed text-white/80">
                                {o.summary}
                            </p>
                        )}

                        {/* Mobile apply panel (sticky panel is desktop-only) */}
                        <div className="mt-6 lg:hidden">
                            <StickyApplyPanel
                                opportunity={o}
                                initialSaved={isSaved}
                                isLoggedIn={isLoggedIn}
                                returnTo={returnTo}
                            />
                        </div>

                        {o.tags.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {o.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/60 ring-1 ring-inset ring-white/10"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {o.descriptionMd && (
                            <div className="mt-8">
                                <h2 className="mb-3 text-xl font-semibold text-white">
                                    About this opportunity
                                </h2>
                                <MarkdownRenderer
                                    content={o.descriptionMd}
                                    variant="dark"
                                />
                            </div>
                        )}

                        {o.goodFor.length > 0 && (
                            <ListBlock
                                title="Good for"
                                items={o.goodFor}
                                icon={
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
                                }
                            />
                        )}
                        {o.requirements.length > 0 && (
                            <ListBlock
                                title="Requirements"
                                items={o.requirements}
                                icon={
                                    <AcademicCapIcon className="h-5 w-5 text-sky-300" />
                                }
                            />
                        )}
                        {o.benefits.length > 0 && (
                            <ListBlock
                                title="Benefits"
                                items={o.benefits}
                                icon={<GiftIcon className="h-5 w-5 text-violet-300" />}
                            />
                        )}

                        {/* Source / disclaimer */}
                        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                            {o.sourceName || o.sourceUrl ? (
                                <p>
                                    Sourced from{" "}
                                    {o.sourceUrl ? (
                                        <a
                                            href={o.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="text-sky-300 underline-offset-2 hover:underline"
                                        >
                                            {o.sourceName ?? o.sourceUrl}
                                        </a>
                                    ) : (
                                        o.sourceName
                                    )}
                                    . Always verify details on the official
                                    application page before applying.
                                </p>
                            ) : (
                                <p>
                                    Always verify details on the official
                                    application page before applying.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sticky panel (desktop) */}
                    <aside className="hidden lg:col-span-1 lg:block">
                        <div className="sticky top-24">
                            <StickyApplyPanel
                                opportunity={o}
                                initialSaved={isSaved}
                                isLoggedIn={isLoggedIn}
                                returnTo={returnTo}
                            />
                        </div>
                    </aside>
                </div>

                {/* Related */}
                {related.length > 0 && (
                    <section className="mt-16">
                        <h2 className="mb-5 text-xl font-semibold text-white">
                            Related opportunities
                        </h2>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((r) => (
                                <OpportunityCard
                                    key={r.id}
                                    opportunity={r}
                                    saved={savedSet.has(r.id)}
                                    isLoggedIn={isLoggedIn}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

function ListBlock({
    title,
    items,
    icon,
}: {
    title: string;
    items: string[];
    icon: React.ReactNode;
}) {
    return (
        <div className="mt-8">
            <h2 className="mb-3 text-xl font-semibold text-white">{title}</h2>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/80">
                        <span className="mt-0.5 flex-shrink-0">{icon}</span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Related = same type or a shared tag, excluding the current opportunity. */
async function getRelated(o: Opportunity): Promise<Opportunity[]> {
    const all = await getPublishedOpportunities();
    const tagSet = new Set(o.tags);
    return all
        .filter(
            (x) =>
                x.id !== o.id &&
                (x.type === o.type || x.tags.some((t) => tagSet.has(t))),
        )
        .slice(0, 3);
}
