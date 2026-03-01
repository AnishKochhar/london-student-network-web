"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Event, EventCoHost, CoHostSearchResult } from "@/app/lib/types";
import {
    Users, UserPlus, Trash2, RefreshCw, Crown, Clock, Check, X,
    ChevronDown, ChevronUp, Search, CreditCard, AlertTriangle, Info, Lock,
    Eye, EyeOff, Bell, BellOff, Settings2
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface CoHostsTabProps {
    event: Event;
    eventId: string;
    onEventUpdate: () => void;
    isPrimary?: boolean;
}

interface EnrichedCoHost extends EventCoHost {
    added_at?: string;
}

// Permission/notification descriptions for tooltips
const PERMISSION_INFO: Record<string, string> = {
    can_edit: "Allows this co-host to edit event details like title, description, date, location, and image.",
    can_manage_registrations: "Allows this co-host to view the Registration tab, manage ticket settings, and handle attendee registrations.",
    can_manage_guests: "Allows this co-host to view the Guests tab, export guest lists, and manage check-ins.",
    can_view_insights: "Allows this co-host to view the Insights tab with event analytics, traffic, and registration trends.",
    receives_registration_emails: "Sends this co-host an email notification every time someone registers for the event.",
    receives_summary_emails: "Sends this co-host a summary email 24 hours before the event with registration stats and guest count.",
    receives_payments: "Directs Stripe ticket payments to this co-host's connected account. Only one organiser can receive payments at a time.",
};

// Self-service setting descriptions
const SELF_SERVICE_INFO: Record<string, string> = {
    is_visible: "When off, your society name and logo will be hidden from the public event page. You'll still appear in the management dashboard.",
    receives_registration_emails: "Receive an email notification each time someone registers for this event.",
    receives_summary_emails: "Receive a summary email 24 hours before the event with registration stats and attendee count.",
};

export default function CoHostsTab({ event, eventId, onEventUpdate, isPrimary = false }: CoHostsTabProps) {
    const { data: session } = useSession();
    const [cohosts, setCohosts] = useState<EnrichedCoHost[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCoHost, setExpandedCoHost] = useState<string | null>(null);
    const [removingUser, setRemovingUser] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null); // user_id pending confirmation

    // Add co-host search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CoHostSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [addingUser, setAddingUser] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const hasPaidTickets = event.tickets?.some((t: { ticket_price?: string }) => {
        const price = parseFloat(t.ticket_price || "0");
        return price > 0;
    }) || false;

    const fetchCohosts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/cohosts?event_id=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setCohosts(data.cohosts || []);
            }
        } catch {
            toast.error("Failed to load co-hosts");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchCohosts();
    }, [fetchCohosts]);

    // Close search dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchSocieties = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const excludeIds = cohosts.map((ch) => ch.user_id).join(",");
            const params = new URLSearchParams({ q: query, limit: "6", ...(excludeIds && { exclude: excludeIds }) });
            const res = await fetch(`/api/societies/search?${params}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.societies || []);
                setShowDropdown(data.societies?.length > 0);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchSocieties(value), 300);
    };

    const handleAddCoHost = async (society: CoHostSearchResult) => {
        setAddingUser(society.user_id);
        setShowDropdown(false);
        setSearchQuery("");
        try {
            const res = await fetch("/api/events/cohosts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add",
                    event_id: eventId,
                    user_id: society.user_id,
                    permissions: {
                        can_edit: false,
                        can_manage_registrations: true,
                        can_manage_guests: true,
                        can_view_insights: true,
                        receives_registration_emails: true,
                        receives_summary_emails: true,
                        receives_payments: false,
                    },
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Invitation sent to ${society.name}`);
                fetchCohosts();
                onEventUpdate();
            } else {
                toast.error(data.error || "Failed to add co-host");
            }
        } catch {
            toast.error("Failed to add co-host");
        } finally {
            setAddingUser(null);
        }
    };

    const handleRemoveCoHost = async (userId: string, name: string) => {
        setConfirmRemove(null);
        setRemovingUser(userId);
        try {
            const res = await fetch("/api/events/cohosts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", event_id: eventId, user_id: userId }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Removed ${name}`);
                fetchCohosts();
                onEventUpdate();
            } else {
                toast.error(data.error || "Failed to remove co-host");
            }
        } catch {
            toast.error("Failed to remove co-host");
        } finally {
            setRemovingUser(null);
        }
    };

    const handleUpdatePermission = async (userId: string, field: string, value: boolean) => {
        // Optimistic update
        setCohosts((prev) =>
            prev.map((ch) => (ch.user_id === userId ? { ...ch, [field]: value } : ch))
        );
        try {
            const res = await fetch("/api/events/cohosts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update",
                    event_id: eventId,
                    user_id: userId,
                    permissions: { [field]: value },
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to update");
                fetchCohosts(); // Revert on error
            }
        } catch {
            toast.error("Failed to update permission");
            fetchCohosts();
        }
    };

    const handleUpdatePaymentRecipient = async (userId: string) => {
        setCohosts((c) =>
            c.map((ch) => ({ ...ch, receives_payments: ch.user_id === userId }))
        );
        try {
            const res = await fetch("/api/events/cohosts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update-payment-recipient", event_id: eventId, user_id: userId }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to update payment recipient");
                fetchCohosts();
            } else {
                toast.success("Payment recipient updated");
            }
        } catch {
            toast.error("Failed to update payment recipient");
            fetchCohosts();
        }
    };

    // Self-service settings update (co-host updating their own preferences)
    const handleUpdateSelfSetting = async (field: string, value: boolean) => {
        // Optimistic update
        setCohosts((prev) =>
            prev.map((ch) => (ch.user_id === session?.user?.id ? { ...ch, [field]: value } : ch))
        );
        try {
            const res = await fetch("/api/events/cohosts/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: eventId, [field]: value }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to update setting");
                fetchCohosts();
            }
        } catch {
            toast.error("Failed to update setting");
            fetchCohosts();
        }
    };

    const primaryHost = cohosts.find((ch) => ch.role === "primary");
    const otherHosts = cohosts.filter((ch) => ch.role !== "primary");
    const myCoHostEntry = !isPrimary && session?.user?.id
        ? cohosts.find((ch) => ch.user_id === session.user.id)
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Co-Hosts
                    </h2>
                    <p className="text-sm text-white/60 mt-1">
                        Manage who can co-organise this event
                    </p>
                </div>
                <button
                    onClick={fetchCohosts}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Self-service preferences for non-primary co-hosts */}
            {!isPrimary && myCoHostEntry && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5" />
                        Your Preferences
                    </p>
                    <div className="space-y-3">
                        <ToggleRow
                            label="Visible on event page"
                            description={SELF_SERVICE_INFO.is_visible}
                            checked={myCoHostEntry.is_visible}
                            onChange={(v) => handleUpdateSelfSetting("is_visible", v)}
                            icon={myCoHostEntry.is_visible ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-white/40" />}
                        />
                        <ToggleRow
                            label="Registration emails"
                            description={SELF_SERVICE_INFO.receives_registration_emails}
                            checked={myCoHostEntry.receives_registration_emails}
                            onChange={(v) => handleUpdateSelfSetting("receives_registration_emails", v)}
                            icon={myCoHostEntry.receives_registration_emails ? <Bell className="w-3.5 h-3.5 text-blue-400" /> : <BellOff className="w-3.5 h-3.5 text-white/40" />}
                        />
                        <ToggleRow
                            label="24h summary email"
                            description={SELF_SERVICE_INFO.receives_summary_emails}
                            checked={myCoHostEntry.receives_summary_emails}
                            onChange={(v) => handleUpdateSelfSetting("receives_summary_emails", v)}
                            icon={myCoHostEntry.receives_summary_emails ? <Bell className="w-3.5 h-3.5 text-blue-400" /> : <BellOff className="w-3.5 h-3.5 text-white/40" />}
                        />
                    </div>
                </div>
            )}

            {/* Read-only notice for non-primary co-hosts */}
            {!isPrimary && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-200/80">
                        Only the primary organiser can manage co-hosts and their permissions. You can view the current co-host configuration below.
                    </p>
                </div>
            )}

            {/* Add Co-Host Search (primary only) */}
            {isPrimary && (
                <div ref={searchRef} className="relative">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <UserPlus className="w-3.5 h-3.5" />
                            Invite Co-Host
                        </p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                                placeholder="Search societies by name..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        {/* Dropdown */}
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 mt-2 mx-4 bg-gray-800 border border-white/20 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                {searchResults.map((society) => (
                                    <button
                                        key={society.user_id}
                                        type="button"
                                        onClick={() => handleAddCoHost(society)}
                                        disabled={addingUser === society.user_id}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
                                    >
                                        {society.logo_url ? (
                                            <Image src={society.logo_url} alt={society.name} width={32} height={32} className="rounded-md object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-xs font-bold">{society.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-white truncate">{society.name}</p>
                                            {society.university_affiliation && (
                                                <p className="text-xs text-white/50 truncate">{society.university_affiliation}</p>
                                            )}
                                        </div>
                                        <UserPlus className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Primary Organiser */}
            {primaryHost && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-3">
                        {primaryHost.logo_url ? (
                            <Image src={primaryHost.logo_url} alt={primaryHost.name || ""} width={36} height={36} className="rounded-lg object-contain flex-shrink-0" />
                        ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                <Crown className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{primaryHost.name}</p>
                            <p className="text-xs text-amber-400/80 flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Primary Organiser
                            </p>
                        </div>
                        {primaryHost.receives_payments && (
                            <span className="text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                                <CreditCard className="w-3 h-3" /> Payment recipient
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Co-Hosts List */}
            {otherHosts.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                        Co-Hosts ({otherHosts.length})
                    </p>
                    {otherHosts.map((cohost) => (
                        <CoHostCard
                            key={cohost.user_id}
                            cohost={cohost}
                            expanded={expandedCoHost === cohost.user_id}
                            onToggleExpand={() => setExpandedCoHost(expandedCoHost === cohost.user_id ? null : cohost.user_id)}
                            onRequestRemove={() => setConfirmRemove(cohost.user_id)}
                            onConfirmRemove={() => handleRemoveCoHost(cohost.user_id, cohost.name || "co-host")}
                            onCancelRemove={() => setConfirmRemove(null)}
                            confirmingRemove={confirmRemove === cohost.user_id}
                            onUpdatePermission={(field, value) => handleUpdatePermission(cohost.user_id, field, value)}
                            onSetPaymentRecipient={() => handleUpdatePaymentRecipient(cohost.user_id)}
                            removing={removingUser === cohost.user_id}
                            hasPaidTickets={hasPaidTickets}
                            readOnly={!isPrimary}
                        />
                    ))}
                </div>
            )}

            {otherHosts.length === 0 && !loading && (
                <div className="text-center py-10 bg-white/5 border border-white/10 rounded-xl">
                    <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/50">No co-hosts yet</p>
                    {isPrimary && (
                        <p className="text-xs text-white/30 mt-1">Use the search above to invite societies</p>
                    )}
                </div>
            )}

            {/* Payment Routing Section */}
            {hasPaidTickets && cohosts.length > 1 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        Payment Routing
                    </p>
                    <p className="text-xs text-white/40 mb-3">
                        Select which organiser receives ticket revenue. Only organisers with Stripe connected are selectable.
                    </p>
                    <div className="space-y-2">
                        {cohosts
                            .filter((ch) => ch.status === "accepted")
                            .map((ch) => {
                                const stripeOk = ch.stripe_charges_enabled && ch.stripe_payouts_enabled;
                                const disabled = !isPrimary || !stripeOk;
                                return (
                                    <label
                                        key={ch.user_id}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                                            disabled ? "cursor-not-allowed" : "cursor-pointer"
                                        } ${
                                            ch.receives_payments
                                                ? "border-green-500/40 bg-green-500/10"
                                                : stripeOk && isPrimary
                                                ? "border-white/10 hover:border-white/20 hover:bg-white/5"
                                                : "border-white/10 opacity-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment-recipient"
                                            checked={ch.receives_payments}
                                            onChange={() => stripeOk && isPrimary && handleUpdatePaymentRecipient(ch.user_id)}
                                            disabled={disabled}
                                            className="accent-green-500"
                                        />
                                        <span className="text-sm text-white flex-1 truncate">{ch.name}</span>
                                        {ch.role === "primary" && (
                                            <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                        )}
                                        {stripeOk ? (
                                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                        ) : (
                                            <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                        )}
                                    </label>
                                );
                            })}
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-300/70">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Changing the payment recipient only affects future purchases. Past payments remain with the previous recipient.</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function CoHostCard({
    cohost,
    expanded,
    onToggleExpand,
    onRequestRemove,
    onConfirmRemove,
    onCancelRemove,
    confirmingRemove,
    onUpdatePermission,
    onSetPaymentRecipient,
    removing,
    hasPaidTickets,
    readOnly,
}: {
    cohost: EnrichedCoHost;
    expanded: boolean;
    onToggleExpand: () => void;
    onRequestRemove: () => void;
    onConfirmRemove: () => void;
    onCancelRemove: () => void;
    confirmingRemove: boolean;
    onUpdatePermission: (field: string, value: boolean) => void;
    onSetPaymentRecipient: () => void;
    removing: boolean;
    hasPaidTickets: boolean;
    readOnly: boolean;
}) {
    const statusColor = {
        pending: "text-amber-400 bg-amber-400/10",
        accepted: "text-green-400 bg-green-400/10",
        declined: "text-red-400 bg-red-400/10",
    }[cohost.status] || "text-white/50 bg-white/10";

    const StatusIcon = {
        pending: Clock,
        accepted: Check,
        declined: X,
    }[cohost.status] || Clock;

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Header — entire row is clickable to expand */}
            <div
                onClick={onToggleExpand}
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
            >
                {cohost.logo_url ? (
                    <Image src={cohost.logo_url} alt={cohost.name || ""} width={36} height={36} className="rounded-lg object-contain flex-shrink-0" />
                ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{(cohost.name || "?").charAt(0).toUpperCase()}</span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{cohost.name}</p>
                    {cohost.university_affiliation && (
                        <p className="text-xs text-white/40 truncate">{cohost.university_affiliation}</p>
                    )}
                </div>
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${statusColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cohost.status.charAt(0).toUpperCase() + cohost.status.slice(1)}
                </span>
                <span className="p-1.5 text-white/50">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
                {!readOnly && !confirmingRemove && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRequestRemove(); }}
                        disabled={removing}
                        className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                        title="Remove co-host"
                    >
                        {removing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                )}
                {!readOnly && confirmingRemove && (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={onConfirmRemove}
                            className="px-2 py-1 text-[11px] font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-md transition-colors"
                        >
                            Remove
                        </button>
                        <button
                            onClick={onCancelRemove}
                            className="px-2 py-1 text-[11px] font-medium bg-white/10 text-white/60 hover:bg-white/20 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Expanded Permissions */}
            {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/10">
                    {/* Permissions */}
                    <div className="mb-4">
                        <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-widest mb-3">
                            Permissions
                        </p>
                        <div className="space-y-3">
                            <ToggleRow label="Edit event details" description={PERMISSION_INFO.can_edit} checked={cohost.can_edit} onChange={(v) => onUpdatePermission("can_edit", v)} readOnly={readOnly} />
                            <ToggleRow label="View registrations" description={PERMISSION_INFO.can_manage_registrations} checked={cohost.can_manage_registrations} onChange={(v) => onUpdatePermission("can_manage_registrations", v)} readOnly={readOnly} />
                            <ToggleRow label="Manage guest list" description={PERMISSION_INFO.can_manage_guests} checked={cohost.can_manage_guests} onChange={(v) => onUpdatePermission("can_manage_guests", v)} readOnly={readOnly} />
                            <ToggleRow label="View insights" description={PERMISSION_INFO.can_view_insights} checked={cohost.can_view_insights} onChange={(v) => onUpdatePermission("can_view_insights", v)} readOnly={readOnly} />
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="mb-4 pt-3 border-t border-white/10">
                        <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-widest mb-3">
                            Notifications
                        </p>
                        <div className="space-y-3">
                            <ToggleRow label="Registration emails" description={PERMISSION_INFO.receives_registration_emails} checked={cohost.receives_registration_emails} onChange={(v) => onUpdatePermission("receives_registration_emails", v)} readOnly={readOnly} />
                            <ToggleRow label="24h summary email" description={PERMISSION_INFO.receives_summary_emails} checked={cohost.receives_summary_emails} onChange={(v) => onUpdatePermission("receives_summary_emails", v)} readOnly={readOnly} />
                        </div>
                    </div>

                    {/* Payment */}
                    {hasPaidTickets && (
                        <div className="pt-3 border-t border-white/10">
                            <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-widest mb-3">
                                Payment
                            </p>
                            <div className="space-y-3">
                                <ToggleRow
                                    label="Receives ticket payments"
                                    description={PERMISSION_INFO.receives_payments}
                                    checked={cohost.receives_payments}
                                    onChange={(v) => {
                                        if (v) onSetPaymentRecipient();
                                    }}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange, readOnly = false, icon }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    readOnly?: boolean;
    icon?: React.ReactNode;
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="py-0.5">
            <label className={`flex items-center justify-between gap-4 ${readOnly ? "cursor-default" : "cursor-pointer"} group`}>
                <div className="flex items-center gap-2 min-w-0">
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    <span className={`text-sm transition-colors ${readOnly ? "text-white/60" : "text-white/80 group-hover:text-white"}`}>{label}</span>
                    {description && (
                        <div className="relative flex-shrink-0">
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTooltip(!showTooltip); }}
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                                className="text-white/30 hover:text-white/60 transition-colors"
                            >
                                <Info className="w-3.5 h-3.5" />
                            </button>
                            {showTooltip && (
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 border border-white/20 text-white/90 text-xs rounded-lg shadow-xl w-56 z-50 pointer-events-none">
                                    {description}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-900 border-r border-b border-white/20 rotate-45 -mt-1" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {readOnly ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                        checked ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-white/40"
                    }`}>
                        {checked ? "On" : "Off"}
                    </span>
                ) : (
                    <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        onClick={() => onChange(!checked)}
                        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                            checked ? "bg-blue-500" : "bg-white/20"
                        }`}
                    >
                        <span
                            className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                checked ? "translate-x-4" : "translate-x-0"
                            }`}
                        />
                    </button>
                )}
            </label>
        </div>
    );
}
