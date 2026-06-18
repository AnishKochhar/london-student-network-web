import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

/**
 * Persistent safety banner shown across every Society Intelligence admin page
 * (spec §8.1). The whole engine is internal-preview only — no outbound
 * communication is ever sent.
 */
export default function OutboundDisabledBanner() {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <ShieldExclamationIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
                <span className="font-semibold">
                    Outbound messaging is disabled.
                </span>{" "}
                No emails, DMs, notifications or claim invites will be sent. This
                engine is internal-preview only — it builds and reviews profiles
                from public sources.
            </div>
        </div>
    );
}
