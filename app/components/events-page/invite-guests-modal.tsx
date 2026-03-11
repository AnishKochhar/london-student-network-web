"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Event, PastAttendee, PastEventSummary, EventOrganiserInfo } from "@/app/lib/types";
import {
    getInvitationTemplate,
    type InvitationTemplateId,
    type InvitationTemplateData,
    type InvitationContentOptions,
} from "@/app/lib/invitations/invitation-email-template";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import InvitationProgress from "./invitation-progress";
import {
    InvitationStepIndicator,
    InvitationTemplatePicker,
    InvitationEmailPreview,
    RecipientListSidebar,
} from "./invitation-shared";

interface InviteGuestsModalProps {
    event: Event;
    eventId: string;
    onClose: () => void;
}

type ModalStep = "select" | "template" | "preview" | "sending";
type SidebarTab = "suggestions" | "enter-emails";

interface SelectedRecipient {
    email: string;
    name: string;
    userId: string | null;
    sourceEventId: string | null;
}

export default function InviteGuestsModal({ event, eventId, onClose }: InviteGuestsModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Data state
    const [contacts, setContacts] = useState<PastAttendee[]>([]);
    const [pastEvents, setPastEvents] = useState<PastEventSummary[]>([]);
    const [organisers, setOrganisers] = useState<EventOrganiserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Step state
    const [step, setStep] = useState<ModalStep>("select");
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("suggestions");

    // Selection state
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeOrganiserFilter, setActiveOrganiserFilter] = useState<string | null>(null);
    const [activeEventFilter, setActiveEventFilter] = useState<string | null>(null);

    // Manual email entry
    const [manualEmails, setManualEmails] = useState("");

    // Template + compose state
    const [selectedTemplateId, setSelectedTemplateId] = useState<InvitationTemplateId>("friendly");
    const [customMessage, setCustomMessage] = useState("");
    const [contentOptions, setContentOptions] = useState<InvitationContentOptions>({
        includeDescription: false,
        includeImage: false,
        includeDuration: false,
        includeSpotsRemaining: false,
    });

    // Sending state
    const [isSending, setIsSending] = useState(false);

    // Fetch contacts on mount
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/events/invitations/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ eventId }),
                });

                if (!res.ok) {
                    throw new Error("Failed to load contacts");
                }

                const data = await res.json();
                if (data.success) {
                    setContacts(data.contacts);
                    setPastEvents(data.pastEvents);
                    if (data.organisers) setOrganisers(data.organisers);
                } else {
                    throw new Error(data.error || "Failed to load contacts");
                }
            } catch (err) {
                console.error("Error fetching contacts:", err);
                setFetchError(err instanceof Error ? err.message : "Failed to load contacts");
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, [eventId]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                if (step !== "sending") onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose, step]);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && step !== "sending") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose, step]);

    // Group past events by organiser for the sidebar
    const hasMultipleOrganisers = organisers.length > 1;

    const eventsByOrganiser = useMemo(() => {
        if (!hasMultipleOrganisers) return null;
        const grouped: Record<string, PastEventSummary[]> = {};
        for (const evt of pastEvents) {
            const key = evt.organiser_id || "unknown";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(evt);
        }
        return grouped;
    }, [pastEvents, hasMultipleOrganisers]);

    // Set of event IDs for the active organiser filter
    const organiserEventIds = useMemo(() => {
        if (!activeOrganiserFilter || !eventsByOrganiser) return null;
        const events = eventsByOrganiser[activeOrganiserFilter] || [];
        return new Set(events.map(e => e.id));
    }, [activeOrganiserFilter, eventsByOrganiser]);

    // Filtered contacts based on search, organiser filter, and event filter
    const filteredContacts = useMemo(() => {
        let filtered = contacts;

        if (activeEventFilter) {
            filtered = filtered.filter((c) => c.source_event_id === activeEventFilter);
        } else if (organiserEventIds) {
            filtered = filtered.filter((c) => organiserEventIds.has(c.source_event_id));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    c.email.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [contacts, searchQuery, activeEventFilter, organiserEventIds]);

    // Build selected recipients list from all sources
    const selectedRecipients = useMemo((): SelectedRecipient[] => {
        const recipients: SelectedRecipient[] = [];

        for (const email of selectedEmails) {
            const contact = contacts.find((c) => c.email === email);
            if (contact) {
                recipients.push({
                    email: contact.email,
                    name: contact.name,
                    userId: contact.user_id,
                    sourceEventId: contact.source_event_id,
                });
            }
        }

        // From manual entry (available after select step)
        if (step !== "select") {
            const manualParsed = parseManualEmails(manualEmails);
            for (const email of manualParsed) {
                if (!selectedEmails.has(email)) {
                    recipients.push({
                        email,
                        name: email.split("@")[0],
                        userId: null,
                        sourceEventId: null,
                    });
                }
            }
        }

        return recipients;
    }, [selectedEmails, contacts, manualEmails, step]);

    // What optional content is available for this event
    const availableContent = useMemo(() => ({
        hasDescription: !!event.description?.trim(),
        hasImage: !!event.image_url?.trim(),
        hasEndTime: !!event.end_datetime,
        hasCapacity: event.capacity != null && event.capacity > 0,
    }), [event]);

    // Build sample template data from real event
    const sampleTemplateData = useMemo((): InvitationTemplateData => {
        const startDate = event.start_datetime ? new Date(event.start_datetime) : null;
        const endDate = event.end_datetime ? new Date(event.end_datetime) : null;

        const eventDate = startDate
            ? startDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              })
            : "TBC";

        const eventTime = startDate
            ? startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "TBC";

        const eventEndTime = contentOptions.includeDuration && endDate
            ? endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : null;

        const eventLocation =
            [event.location_building, event.location_area].filter(Boolean).join(", ") || "TBC";

        const shortId = event.id ? base16ToBase62(event.id) : "";
        const eventUrl = `https://londonstudentnetwork.com/events/${shortId}`;

        const sampleName =
            selectedRecipients.length > 0 ? selectedRecipients[0].name : "Guest";

        return {
            recipientName: sampleName,
            organiserName: event.organiser || "London Student Network",
            eventTitle: event.title,
            eventDate,
            eventTime,
            eventLocation,
            eventUrl,
            customMessage: customMessage || null,
            eventDescription: contentOptions.includeDescription ? event.description : null,
            eventImageUrl: contentOptions.includeImage ? event.image_url : null,
            eventEndTime: eventEndTime || null,
            spotsRemaining: contentOptions.includeSpotsRemaining && event.capacity
                ? event.capacity // Preview shows capacity (actual spots remaining computed server-side)
                : null,
        };
    }, [event, customMessage, selectedRecipients, contentOptions]);

    // Build preview HTML for the selected template
    const previewEmailHtml = useMemo(() => {
        const template = getInvitationTemplate(selectedTemplateId);
        return template.buildHtml(sampleTemplateData);
    }, [selectedTemplateId, sampleTemplateData]);

    const toggleContact = (email: string) => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            if (next.has(email)) {
                next.delete(email);
            } else {
                next.add(email);
            }
            return next;
        });
    };

    const selectAllVisible = () => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            for (const contact of filteredContacts) {
                next.add(contact.email);
            }
            return next;
        });
    };

    const deselectAllVisible = () => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            for (const contact of filteredContacts) {
                next.delete(contact.email);
            }
            return next;
        });
    };

    const removeRecipient = (email: string) => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            next.delete(email);
            return next;
        });
    };

    const handleNext = () => {
        switch (step) {
            case "select": {
                const manualParsed = parseManualEmails(manualEmails);
                const totalCount = selectedEmails.size + manualParsed.length;
                if (totalCount === 0) {
                    toast.error("Please select at least one recipient");
                    return;
                }
                setStep("template");
                break;
            }
            case "template":
                setStep("preview");
                break;
            case "preview":
                handleSend();
                break;
        }
    };

    const handleBack = () => {
        switch (step) {
            case "template":
                setStep("select");
                break;
            case "preview":
                setStep("template");
                break;
        }
    };

    const handleSend = async () => {
        if (selectedRecipients.length === 0) {
            toast.error("No recipients selected");
            return;
        }

        setIsSending(true);

        try {
            const res = await fetch("/api/events/invitations/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId,
                    recipients: selectedRecipients.map((r) => ({
                        email: r.email,
                        name: r.name,
                        userId: r.userId,
                        sourceEventId: r.sourceEventId,
                    })),
                    customMessage: customMessage || null,
                    templateId: selectedTemplateId,
                    contentOptions,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                let message = `Server error (${res.status})`;
                try { message = JSON.parse(text).error || message; } catch { /* non-JSON response */ }
                throw new Error(message);
            }

            const data = await res.json();

            if (data.success && data.queued) {
                setStep("sending");
                toast.success(`Sending invitations to ${data.inserted} recipients`);
            } else if (data.success && !data.queued) {
                toast(data.message || "All recipients already invited", { icon: "\u2139\uFE0F" });
                setIsSending(false);
            } else {
                throw new Error(data.error || "Failed to send invitations");
            }
        } catch (err) {
            console.error("Error sending invitations:", err);
            toast.error(err instanceof Error ? err.message : "Failed to send invitations");
            setIsSending(false);
        }
    };

    const allVisibleSelected =
        filteredContacts.length > 0 && filteredContacts.every((c) => selectedEmails.has(c.email));

    const formatEventDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    };


    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (step !== "sending") {
                    e.stopPropagation();
                }
            }}
        >
            <div
                ref={modalRef}
                className="relative bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] w-full max-w-4xl h-[85vh] rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-center p-5 pb-3">
                        <h2 className="text-xl font-semibold text-white">Invite Guests</h2>
                        <div className="flex items-center gap-3">
                            {step === "select" && selectedEmails.size > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                                    {selectedEmails.size} selected
                                </span>
                            )}
                            {step !== "sending" && (
                                <button
                                    onClick={onClose}
                                    className="text-white/40 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="px-5 pb-3">
                        <InvitationStepIndicator currentStep={step} />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">

                    {/* ── Step 1: Select ── */}
                    {step === "select" && (
                        <div className="flex flex-1 min-h-0">
                            {/* Left Sidebar */}
                            <div className="w-56 border-r border-white/10 flex flex-col flex-shrink-0 min-h-0">
                                <div className="p-3 space-y-1 border-b border-white/10">
                                    <button
                                        onClick={() => setSidebarTab("suggestions")}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                            sidebarTab === "suggestions"
                                                ? "bg-indigo-500/20 text-indigo-300"
                                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        Suggestions
                                    </button>
                                    <button
                                        onClick={() => setSidebarTab("enter-emails")}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                            sidebarTab === "enter-emails"
                                                ? "bg-indigo-500/20 text-indigo-300"
                                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Enter Emails
                                    </button>
                                </div>

                                {sidebarTab === "suggestions" && (
                                    <div className="flex-1 overflow-y-auto">
                                        {/* Global "All" filter */}
                                        <div className="p-2 pb-0">
                                            <button
                                                onClick={() => { setActiveEventFilter(null); setActiveOrganiserFilter(null); }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    activeEventFilter === null && activeOrganiserFilter === null
                                                        ? "bg-white/10 text-white"
                                                        : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                                }`}
                                            >
                                                <p className="font-medium truncate">All Contacts</p>
                                                <p className="text-xs text-white/40">{contacts.length} contacts</p>
                                            </button>
                                        </div>

                                        {hasMultipleOrganisers && eventsByOrganiser ? (
                                            /* Grouped by organiser */
                                            organisers.map((org) => {
                                                const orgEvents = eventsByOrganiser[org.user_id] || [];
                                                const orgContactCount = orgEvents.reduce((sum, e) => sum + e.attendee_count, 0);
                                                const isOrgActive = activeOrganiserFilter === org.user_id && activeEventFilter === null;
                                                return (
                                                    <div key={org.user_id} className="mt-1">
                                                        <button
                                                            onClick={() => { setActiveOrganiserFilter(org.user_id); setActiveEventFilter(null); }}
                                                            className={`w-full text-left px-3 mx-2 py-1.5 rounded-lg transition-colors ${
                                                                isOrgActive
                                                                    ? "bg-white/10 text-white"
                                                                    : "text-white/50 hover:bg-white/5 hover:text-white/70"
                                                            }`}
                                                        >
                                                            <p className="text-xs font-semibold uppercase tracking-wider truncate">
                                                                {org.is_self ? "Your Events" : org.name}
                                                            </p>
                                                            <p className="text-[10px] text-white/30">
                                                                {orgEvents.length} events &middot; {orgContactCount} contacts
                                                            </p>
                                                        </button>
                                                        <div className="px-2 space-y-0.5 mt-0.5">
                                                            {orgEvents.map((evt) => (
                                                                <button
                                                                    key={evt.id}
                                                                    onClick={() => { setActiveOrganiserFilter(org.user_id); setActiveEventFilter(evt.id); }}
                                                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                                        activeEventFilter === evt.id
                                                                            ? "bg-white/10 text-white"
                                                                            : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                                                    }`}
                                                                >
                                                                    <p className="font-medium truncate text-xs">{evt.title}</p>
                                                                    <p className="text-[10px] text-white/40">
                                                                        {formatEventDate(evt.start_datetime)} &middot; {evt.attendee_count} guests
                                                                    </p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            /* Single organiser — flat list */
                                            <div className="p-2 pt-0 space-y-0.5">
                                                {pastEvents.map((evt) => (
                                                    <button
                                                        key={evt.id}
                                                        onClick={() => setActiveEventFilter(evt.id)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                            activeEventFilter === evt.id
                                                                ? "bg-white/10 text-white"
                                                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                                        }`}
                                                    >
                                                        <p className="font-medium truncate">{evt.title}</p>
                                                        <p className="text-xs text-white/40">
                                                            {formatEventDate(evt.start_datetime)} &middot; {evt.attendee_count} guests
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Content */}
                            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                                {sidebarTab === "suggestions" ? (
                                    <>
                                        <div className="p-3 border-b border-white/10 space-y-2 flex-shrink-0">
                                            <div className="relative">
                                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    placeholder="Search contacts..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/15 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-white/40">
                                                    {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
                                                    {activeEventFilter ? " from this event" : ""}
                                                </span>
                                                <button
                                                    onClick={allVisibleSelected ? deselectAllVisible : selectAllVisible}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                                >
                                                    {allVisibleSelected ? "Deselect All" : "Select All"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto min-h-0">
                                            {loading ? (
                                                <div className="flex items-center justify-center h-full min-h-[200px]">
                                                    <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
                                                    <span className="ml-3 text-sm text-white/40">Loading contacts...</span>
                                                </div>
                                            ) : fetchError ? (
                                                <div className="flex items-center justify-center h-full min-h-[200px] px-4">
                                                    <p className="text-red-400 text-sm">{fetchError}</p>
                                                </div>
                                            ) : filteredContacts.length === 0 ? (
                                                <div className="flex items-center justify-center h-full min-h-[200px] px-4">
                                                    <p className="text-white/50 text-sm">
                                                        {contacts.length === 0
                                                            ? "No past attendees found. Use &lsquo;Enter Emails&rsquo; to invite people manually."
                                                            : "No contacts match your search."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-white/5">
                                                    {filteredContacts.map((contact) => (
                                                        <button
                                                            key={contact.email}
                                                            onClick={() => toggleContact(contact.email)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-xs font-medium text-white">
                                                                    {contact.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                                                                <p className="text-xs text-white/40 truncate">{contact.email}</p>
                                                            </div>
                                                            {contact.events_attended > 1 && (
                                                                <span className="text-xs text-white/30 flex-shrink-0">
                                                                    {contact.events_attended} events
                                                                </span>
                                                            )}
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                selectedEmails.has(contact.email)
                                                                    ? "border-indigo-400 bg-indigo-500"
                                                                    : "border-white/20"
                                                            }`}>
                                                                {selectedEmails.has(contact.email) && (
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-4 flex flex-col flex-1 min-h-0">
                                        <p className="text-sm text-white/60 mb-3">
                                            Enter email addresses, one per line or separated by commas.
                                        </p>
                                        <textarea
                                            value={manualEmails}
                                            onChange={(e) => setManualEmails(e.target.value)}
                                            placeholder={"alice@example.com\nbob@example.com\ncharlie@example.com"}
                                            className="flex-1 w-full bg-white/5 border border-white/15 rounded-lg p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                                        />
                                        <p className="text-xs text-white/30 mt-2">
                                            {parseManualEmails(manualEmails).length} valid email{parseManualEmails(manualEmails).length !== 1 ? "s" : ""} entered
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Template ── */}
                    {step === "template" && (
                        <div className="flex flex-1 min-h-0">
                            <RecipientListSidebar
                                recipients={selectedRecipients}
                                onRemove={removeRecipient}
                            />
                            <div className="flex-1 overflow-y-auto min-w-0 p-5">
                                <InvitationTemplatePicker
                                    selectedTemplateId={selectedTemplateId}
                                    onSelectTemplate={setSelectedTemplateId}
                                    sampleData={sampleTemplateData}
                                    customMessage={customMessage}
                                    onCustomMessageChange={setCustomMessage}
                                    contentOptions={contentOptions}
                                    onContentOptionsChange={setContentOptions}
                                    availableContent={availableContent}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Preview ── */}
                    {step === "preview" && (
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-5">
                            <InvitationEmailPreview
                                selectedTemplateId={selectedTemplateId}
                                previewHtml={previewEmailHtml}
                                recipientName={sampleTemplateData.recipientName}
                                onChangeTemplate={() => setStep("template")}
                            />
                        </div>
                    )}

                    {/* ── Step 4: Sending ── */}
                    {step === "sending" && (
                        <div className="p-5">
                            <InvitationProgress
                                eventId={eventId}
                                onComplete={() => {}}
                                onClose={onClose}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== "sending" && (
                    <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5 flex-shrink-0">
                        {step === "select" ? (
                            <>
                                <span className="text-xs text-white/30">
                                    {selectedEmails.size + parseManualEmails(manualEmails).length} recipients selected
                                </span>
                                <button
                                    onClick={handleNext}
                                    disabled={selectedEmails.size + parseManualEmails(manualEmails).length === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Next
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={step === "preview" && (isSending || selectedRecipients.length === 0)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    {step === "preview" ? (
                                        isSending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Invitations
                                            </>
                                        )
                                    ) : (
                                        <>
                                            Preview
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

function parseManualEmails(input: string): string[] {
    if (!input.trim()) return [];
    return input
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}
