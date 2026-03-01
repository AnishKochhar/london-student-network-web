"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Flag } from "lucide-react";
import { Event, EventCoHost } from "@/app/lib/types";
import { returnLogo } from "@/app/lib/utils";

interface OrganiserListProps {
    event: Event;
    variant: "modal" | "page";
    onReport?: () => void;
    dbLogoUrl?: string | null;
}

const ADMIN_UID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";

/**
 * Shared component for displaying event organisers (primary + co-hosts).
 * Used by both EventModal and ModernEventInfo (full event page).
 * Falls back to single organiser display when no co_hosts data is present.
 */
export default function OrganiserList({ event, variant, onReport, dbLogoUrl }: OrganiserListProps) {
    const router = useRouter();
    const visibleHosts = getVisibleHosts(event);

    // Fallback: single organiser display (backward compatibility)
    if (visibleHosts.length === 0) {
        return (
            <SingleOrganiserCard
                event={event}
                variant={variant}
                onReport={onReport}
                dbLogoUrl={dbLogoUrl}
            />
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Hosted By
            </h3>

            <div className="space-y-3">
                {visibleHosts.map((host) => (
                    <OrganiserRow
                        key={host.user_id}
                        host={host}
                        variant={variant}
                        isPrimary={host.role === "primary"}
                    />
                ))}
            </div>

            {/* Contact Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-200 mt-4">
                {visibleHosts.length === 1 ? (
                    // Single host: simple contact button
                    event.organiser_uid !== ADMIN_UID && (
                        <button
                            onClick={() => router.push(`/societies/message/${visibleHosts[0].slug || visibleHosts[0].user_id}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Contact Host
                        </button>
                    )
                ) : (
                    // Multiple hosts: per-host contact buttons
                    visibleHosts.filter(h => h.user_id !== ADMIN_UID).map((host) => (
                        <button
                            key={host.user_id}
                            onClick={() => router.push(`/societies/message/${host.slug || host.user_id}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Contact {host.name}
                        </button>
                    ))
                )}
                {onReport && (
                    <button
                        onClick={onReport}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Flag className="w-4 h-4" />
                        Report Event
                    </button>
                )}
            </div>
        </div>
    );
}

/** Single organiser row within the list */
function OrganiserRow({
    host,
    variant,
    isPrimary,
}: {
    host: EventCoHost;
    variant: "modal" | "page";
    isPrimary: boolean;
}) {
    const logoSize = variant === "page" ? 48 : 44;
    const logoSrc = resolveHostLogo(host);

    return (
        <div className="flex items-center gap-3">
            {logoSrc && (
                <Image
                    src={logoSrc}
                    alt={`${host.name || "Organiser"} logo`}
                    width={logoSize}
                    height={logoSize}
                    className="object-contain rounded-lg flex-shrink-0"
                />
            )}
            {!logoSrc && (
                <div
                    className="rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0"
                    style={{ width: logoSize, height: logoSize }}
                >
                    <span className="text-white text-sm font-bold">
                        {(host.name || "?").charAt(0).toUpperCase()}
                    </span>
                </div>
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {variant === "page" && host.slug ? (
                        <Link
                            href={`/societies/${host.slug}`}
                            className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors truncate"
                        >
                            {host.name}
                        </Link>
                    ) : (
                        <p className="text-base font-bold text-gray-900 truncate">{host.name}</p>
                    )}
                    {isPrimary && (
                        <span className="text-xs text-gray-400 flex-shrink-0">Organiser</span>
                    )}
                </div>
                {host.university_affiliation && (
                    <p className="text-xs text-gray-500 truncate">{host.university_affiliation}</p>
                )}
            </div>
        </div>
    );
}

/** Fallback: single organiser card (when co_hosts data is not available) */
function SingleOrganiserCard({
    event,
    variant,
    onReport,
    dbLogoUrl,
}: {
    event: Event;
    variant: "modal" | "page";
    onReport?: () => void;
    dbLogoUrl?: string | null;
}) {
    const router = useRouter();
    const societyLogo = returnLogo(event.organiser);
    const logoSrc = societyLogo.found
        ? societyLogo.src || "/images/societies/roar.png"
        : dbLogoUrl || null;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Hosted By
            </h3>

            <div className="flex items-center gap-3 mb-4">
                {logoSrc && (
                    <Image
                        src={logoSrc}
                        alt="Society Logo"
                        width={48}
                        height={48}
                        className="object-contain rounded-lg"
                    />
                )}
                <div>
                    {variant === "page" && event.organiser_slug ? (
                        <Link
                            href={`/societies/${event.organiser_slug}`}
                            className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                            {event.organiser}
                        </Link>
                    ) : (
                        <p className="text-base font-bold text-gray-900">{event.organiser}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
                {event.organiser_uid !== ADMIN_UID && (
                    <button
                        onClick={() => router.push(`/societies/message/${event.organiser_slug || event.organiser_uid}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Host
                    </button>
                )}
                {onReport && (
                    <button
                        onClick={onReport}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Flag className="w-4 h-4" />
                        Report Event
                    </button>
                )}
            </div>
        </div>
    );
}

// --- Helpers ---

function getVisibleHosts(event: Event): EventCoHost[] {
    if (!event.co_hosts || event.co_hosts.length === 0) return [];
    return event.co_hosts
        .filter((ch) => ch.is_visible && ch.status === "accepted")
        .sort((a, b) => {
            // Primary first, then by display_order
            if (a.role === "primary" && b.role !== "primary") return -1;
            if (a.role !== "primary" && b.role === "primary") return 1;
            return a.display_order - b.display_order;
        });
}

function resolveHostLogo(host: EventCoHost): string | null {
    // First try the enriched logo_url from the JOIN
    if (host.logo_url) return host.logo_url;
    // Then try the local SocietyLogos array
    if (host.name) {
        const local = returnLogo(host.name);
        if (local.found && local.src) return local.src;
    }
    return null;
}

/**
 * Helper to format organiser display for event cards.
 * Shows truncated multi-organiser text like "KCL Neurotech & Imperial AI" or "KCL Neurotech + 2 more".
 */
export function formatOrganiserDisplay(event: Event): string {
    const visible = (event.co_hosts || []).filter(
        (ch) => ch.is_visible && ch.status === "accepted"
    );
    if (visible.length === 0) return event.organiser;

    const primary = visible.find((ch) => ch.role === "primary");
    const others = visible.filter((ch) => ch.role !== "primary");
    const name = primary?.name || event.organiser;

    if (others.length === 0) return name;
    if (others.length === 1) return `${name} & ${others[0].name}`;
    return `${name} + ${others.length} more`;
}
