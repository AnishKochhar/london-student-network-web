"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDaysIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { SocietyEventCandidate } from "@/app/lib/societies/types";

/**
 * Event-candidate tab for a society (spec §12). Candidates are stored for review
 * only — they are NOT published publicly in this phase.
 */
export default function SocietyEventsTab({ societyId }: { societyId: string }) {
    const [events, setEvents] = useState<SocietyEventCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/societies/${societyId}/events`);
            const data = await res.json();
            setEvents(data.events ?? []);
        } catch {
            /* non-fatal */
        } finally {
            setLoading(false);
        }
    }, [societyId]);

    useEffect(() => {
        load();
    }, [load]);

    async function discover() {
        setBusy("discover");
        try {
            const res = await fetch(`/api/admin/societies/${societyId}/events`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(
                `Found ${data.summary.found}, created ${data.summary.created}`,
            );
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Discovery failed");
        } finally {
            setBusy(null);
        }
    }

    async function act(id: string, kind: string, label: string) {
        setBusy(id);
        try {
            const res = await fetch(`/api/admin/society-events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind }),
            });
            if (!res.ok) throw new Error();
            toast.success(label);
            load();
        } catch {
            toast.error("Action failed");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <CalendarDaysIcon className="h-4 w-4 text-sky-300" />
                    Event candidates ({events.length})
                </h2>
                <button
                    onClick={discover}
                    disabled={busy === "discover"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-60"
                >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    {busy === "discover" ? "Discovering…" : "Discover"}
                </button>
            </div>

            {loading ? (
                <p className="text-xs text-white/50">Loading…</p>
            ) : events.length === 0 ? (
                <p className="text-xs text-white/50">
                    No event candidates yet. “Discover” scans the society&apos;s
                    stored source HTML for event-platform links. (Not published
                    publicly.)
                </p>
            ) : (
                <ul className="space-y-2">
                    {events.map((e) => (
                        <li
                            key={e.id}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                            <div className="text-sm text-white">{e.title}</div>
                            <div className="text-xs text-white/40">
                                {e.eventDate
                                    ? new Date(e.eventDate).toLocaleDateString(
                                          "en-GB",
                                      )
                                    : "date unknown"}{" "}
                                · {e.status}
                            </div>
                            {e.status === "new" && (
                                <div className="mt-2 flex gap-1.5">
                                    <button
                                        onClick={() =>
                                            act(e.id, "approve", "Sent to review")
                                        }
                                        disabled={busy === e.id}
                                        className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() =>
                                            act(e.id, "reject", "Rejected")
                                        }
                                        disabled={busy === e.id}
                                        className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-200 hover:bg-rose-500/20"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
