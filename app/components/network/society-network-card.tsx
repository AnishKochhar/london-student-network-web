import Link from "next/link";
import {
    SOCIETY_TYPE_LABELS,
    type Society,
} from "@/app/lib/societies/types";

/** Initials for the gradient avatar fallback. */
function initials(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
}

/**
 * Public society card for the /network directory. Links to the profile at
 * /network/[universitySlug]/[societySlug] (university id == slug for the five
 * targets).
 */
export default function SocietyNetworkCard({ society }: { society: Society }) {
    const href = `/network/${society.universityId}/${society.slug}`;
    return (
        <Link
            href={href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
        >
            <div className="flex items-start gap-3 p-5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    {society.logoUrl && /^https?:\/\//i.test(society.logoUrl) ? (
                        // Logos are arbitrary external/scraped URLs — a plain <img>
                        // avoids next/image's remote-domain allowlist requirement.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={society.logoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400/30 to-emerald-400/30 text-sm font-bold text-white">
                            {initials(society.name)}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                            {society.universityShortName}
                        </span>
                        {society.isFeatured && (
                            <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                                Featured
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 truncate font-semibold text-white group-hover:underline">
                        {society.name}
                    </h3>
                    <p className="text-xs text-white/50">
                        {society.category ?? SOCIETY_TYPE_LABELS[society.type]}
                    </p>
                </div>
            </div>

            {society.shortDescription && (
                <p className="line-clamp-2 px-5 text-sm text-white/70">
                    {society.shortDescription}
                </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 p-5 pt-4">
                <div className="flex flex-wrap gap-1.5">
                    {(society.tags ?? []).slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/60"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <span className="shrink-0 text-xs font-medium text-sky-300">
                    View profile →
                </span>
            </div>
        </Link>
    );
}
