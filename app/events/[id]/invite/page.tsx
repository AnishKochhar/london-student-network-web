"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { base62ToBase16, base16ToBase62 } from "@/app/lib/uuid-utils";
import { Event } from "@/app/lib/types";
import toast from "react-hot-toast";
import InvitationProgress from "@/app/components/events-page/invitation-progress";
import { PastAttendee, PastEventSummary, EventOrganiserInfo } from "@/app/lib/types";
import {
    getInvitationTemplate,
    type InvitationTemplateId,
    type InvitationTemplateData,
    type InvitationContentOptions,
} from "@/app/lib/invitations/invitation-email-template";
import {
    InvitationStepIndicator,
    InvitationTemplatePicker,
    InvitationEmailPreview,
    RecipientListSidebar,
} from "@/app/components/events-page/invitation-shared";

interface SelectedRecipient {
    email: string;
    name: string;
    userId: string | null;
    sourceEventId: string | null;
}

type PageState = "loading" | "select" | "template" | "preview" | "sending" | "done";
type SidebarTab = "suggestions" | "enter-emails";

export default function InviteAfterCreatePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: session, status } = useSession();

    const [event, setEvent] = useState<Event | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    // Contact data
    const [contacts, setContacts] = useState<PastAttendee[]>([]);
    const [pastEvents, setPastEvents] = useState<PastEventSummary[]>([]);
    const [organisers, setOrganisers] = useState<EventOrganiserInfo[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);

    // Selection state
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeOrganiserFilter, setActiveOrganiserFilter] = useState<string | null>(null);
    const [activeEventFilter, setActiveEventFilter] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("suggestions");
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
    const [pageState, setPageState] = useState<PageState>("loading");
    const [isSending, setIsSending] = useState(false);

    const eventId = base62ToBase16(id);

    // Fetch event details
    const fetchEvent = useCallback(async () => {
        if (status === "loading") return;
        if (!session?.user?.id) {
            router.push("/");
            return;
        }

        try {
            const response = await fetch("/api/events/manage-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: eventId }),
            });

            if (!response.ok) {
                toast.error("You don't have permission to manage this event");
                router.push(`/events/${id}`);
                return;
            }

            const data = await response.json();
            setEvent(data.event);
            setPageLoading(false);
            setPageState("select");
        } catch {
            toast.error("Failed to load event");
            router.push(`/events/${id}/manage`);
        }
    }, [eventId, id, router, session, status]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    // Fetch contacts
    useEffect(() => {
        if (!event) return;

        const fetchContacts = async () => {
            try {
                setContactsLoading(true);
                const res = await fetch("/api/events/invitations/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ eventId }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setContacts(data.contacts);
                        setPastEvents(data.pastEvents);
                        if (data.organisers) setOrganisers(data.organisers);
                    }
                }
            } catch (err) {
                console.error("Error fetching contacts:", err);
            } finally {
                setContactsLoading(false);
            }
        };

        fetchContacts();
    }, [event, eventId]);

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

    const organiserEventIds = useMemo(() => {
        if (!activeOrganiserFilter || !eventsByOrganiser) return null;
        const events = eventsByOrganiser[activeOrganiserFilter] || [];
        return new Set(events.map(e => e.id));
    }, [activeOrganiserFilter, eventsByOrganiser]);

    const filteredContacts = useMemo(() => {
        let filtered = contacts;
        if (activeEventFilter) {
            filtered = filtered.filter((c) => c.source_event_id === activeEventFilter);
        } else if (organiserEventIds) {
            filtered = filtered.filter((c) => organiserEventIds.has(c.source_event_id));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [contacts, activeEventFilter, searchQuery, organiserEventIds]);

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
        if (pageState !== "select") {
            const manualParsed = parseManualEmails(manualEmails);
            for (const email of manualParsed) {
                if (!selectedEmails.has(email)) {
                    recipients.push({ email, name: email.split("@")[0], userId: null, sourceEventId: null });
                }
            }
        }
        return recipients;
    }, [selectedEmails, contacts, manualEmails, pageState]);

    const availableContent = useMemo(() => {
        if (!event) return { hasDescription: false, hasImage: false, hasEndTime: false, hasCapacity: false };
        return {
            hasDescription: !!event.description?.trim(),
            hasImage: !!event.image_url?.trim(),
            hasEndTime: !!event.end_datetime,
            hasCapacity: event.capacity != null && event.capacity > 0,
        };
    }, [event]);

    const sampleTemplateData = useMemo((): InvitationTemplateData | null => {
        if (!event) return null;
        const startDate = event.start_datetime ? new Date(event.start_datetime) : null;
        const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
        const eventDate = startDate
            ? startDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
            : "TBC";
        const eventTime = startDate
            ? startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "TBC";
        const eventEndTime = contentOptions.includeDuration && endDate
            ? endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : null;
        const eventLocation = [event.location_building, event.location_area].filter(Boolean).join(", ") || "TBC";
        const shortId = event.id ? base16ToBase62(event.id) : "";
        const eventUrl = `https://londonstudentnetwork.com/events/${shortId}`;
        const sampleName = selectedRecipients.length > 0 ? selectedRecipients[0].name : "Guest";

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
                ? event.capacity
                : null,
        };
    }, [event, customMessage, selectedRecipients, contentOptions]);

    const previewEmailHtml = useMemo(() => {
        if (!sampleTemplateData) return "";
        const template = getInvitationTemplate(selectedTemplateId);
        return template.buildHtml(sampleTemplateData);
    }, [selectedTemplateId, sampleTemplateData]);

    const toggleContact = (email: string) => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            if (next.has(email)) next.delete(email);
            else next.add(email);
            return next;
        });
    };

    const selectAllVisible = () => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            for (const c of filteredContacts) next.add(c.email);
            return next;
        });
    };

    const deselectAllVisible = () => {
        setSelectedEmails((prev) => {
            const next = new Set(prev);
            for (const c of filteredContacts) next.delete(c.email);
            return next;
        });
    };

    const allVisibleSelected = filteredContacts.length > 0 &&
        filteredContacts.every((c) => selectedEmails.has(c.email));

    const formatEventDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    };

    const handleNext = () => {
        switch (pageState) {
            case "select": {
                const total = selectedEmails.size + parseManualEmails(manualEmails).length;
                if (total === 0) {
                    toast.error("Please select at least one recipient");
                    return;
                }
                setPageState("template");
                break;
            }
            case "template":
                setPageState("preview");
                break;
            case "preview":
                handleSend();
                break;
        }
    };

    const handleBack = () => {
        switch (pageState) {
            case "template":
                setPageState("select");
                break;
            case "preview":
                setPageState("template");
                break;
        }
    };

    const handleSend = async () => {
        if (selectedRecipients.length === 0) return;

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

            const data = await res.json();
            if (data.success && data.queued) {
                setPageState("sending");
                toast.success(`Sending invitations to ${data.inserted} recipients`);
            } else if (data.success) {
                toast(data.message || "All recipients already invited", { icon: "\u2139\uFE0F" });
                setIsSending(false);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send invitations");
            setIsSending(false);
        }
    };

    const goToManage = () => router.push(`/events/${id}/manage`);

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#020B18] via-[#041A2E] to-[#020B18] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020B18] via-[#041A2E] to-[#020B18]">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Event Created Success Banner */}
                <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-green-300 font-medium">Event created successfully!</p>
                        <p className="text-green-300/60 text-sm">{event.title} is now live</p>
                    </div>
                    <button onClick={goToManage} className="text-sm text-white/50 hover:text-white underline transition-colors">
                        Skip to manage page
                    </button>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 pb-3 border-b border-white/10">
                        <h1 className="text-2xl font-bold text-white mb-3">Invite Guests</h1>

                        {/* Step indicator */}
                        {pageState !== "done" && (
                            <InvitationStepIndicator currentStep={pageState} />
                        )}
                    </div>

                    {/* Sending Progress */}
                    {pageState === "sending" && (
                        <div className="p-6">
                            <InvitationProgress
                                eventId={eventId}
                                onComplete={() => setPageState("done")}
                                onClose={goToManage}
                            />
                        </div>
                    )}

                    {/* Done State */}
                    {pageState === "done" && (
                        <div className="p-6 text-center">
                            <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-xl font-bold text-white mb-2">Invitations Sent!</h2>
                            <p className="text-white/50 mb-6">Your guests will receive their invitations shortly.</p>
                            <button onClick={goToManage} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                                Go to Event Management
                            </button>
                        </div>
                    )}

                    {/* Select Step */}
                    {pageState === "select" && (
                        <div className="flex" style={{ minHeight: "500px" }}>
                            {/* Left Sidebar */}
                            <div className="w-56 border-r border-white/10 flex flex-col flex-shrink-0">
                                <div className="p-3 space-y-1 border-b border-white/10">
                                    <button
                                        onClick={() => setSidebarTab("suggestions")}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                            sidebarTab === "suggestions" ? "bg-indigo-500/20 text-indigo-300" : "text-white/60 hover:bg-white/5"
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
                                            sidebarTab === "enter-emails" ? "bg-indigo-500/20 text-indigo-300" : "text-white/60 hover:bg-white/5"
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
                            <div className="flex-1 flex flex-col min-w-0">
                                {sidebarTab === "suggestions" ? (
                                    <>
                                        <div className="p-3 border-b border-white/10 space-y-2">
                                            <div className="relative">
                                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    placeholder="Search contacts..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/15 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-white/40">{filteredContacts.length} contacts</span>
                                                <button onClick={allVisibleSelected ? deselectAllVisible : selectAllVisible} className="text-xs text-indigo-400 hover:text-indigo-300">
                                                    {allVisibleSelected ? "Deselect All" : "Select All"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {contactsLoading ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
                                                    <span className="ml-3 text-sm text-white/40">Loading contacts...</span>
                                                </div>
                                            ) : filteredContacts.length === 0 ? (
                                                <div className="text-center py-12 px-4">
                                                    <p className="text-white/50 text-sm">
                                                        {contacts.length === 0 ? "No past attendees found." : "No contacts match your search."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-white/5">
                                                    {filteredContacts.map((contact) => (
                                                        <button key={contact.email} onClick={() => toggleContact(contact.email)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-xs font-medium text-white">{contact.name.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                                                                <p className="text-xs text-white/40 truncate">{contact.email}</p>
                                                            </div>
                                                            {contact.events_attended > 1 && (
                                                                <span className="text-xs text-white/30">{contact.events_attended} events</span>
                                                            )}
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                selectedEmails.has(contact.email) ? "border-indigo-400 bg-indigo-500" : "border-white/20"
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
                                    <div className="p-4 flex flex-col flex-1">
                                        <p className="text-sm text-white/60 mb-3">Enter email addresses, one per line or separated by commas.</p>
                                        <textarea
                                            value={manualEmails}
                                            onChange={(e) => setManualEmails(e.target.value)}
                                            placeholder={"alice@example.com\nbob@example.com"}
                                            className="flex-1 w-full bg-white/5 border border-white/15 rounded-lg p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                                        />
                                        <p className="text-xs text-white/30 mt-2">
                                            {parseManualEmails(manualEmails).length} valid emails entered
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Template Step */}
                    {pageState === "template" && sampleTemplateData && (
                        <div className="flex" style={{ minHeight: "500px" }}>
                            <RecipientListSidebar recipients={selectedRecipients} />
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

                    {/* Preview Step */}
                    {pageState === "preview" && sampleTemplateData && (
                        <div className="p-6">
                            <InvitationEmailPreview
                                selectedTemplateId={selectedTemplateId}
                                previewHtml={previewEmailHtml}
                                recipientName={sampleTemplateData.recipientName}
                                onChangeTemplate={() => setPageState("template")}
                                iframeHeight="500px"
                            />
                        </div>
                    )}

                    {/* Footer */}
                    {(pageState === "select" || pageState === "template" || pageState === "preview") && (
                        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
                            {pageState === "select" ? (
                                <>
                                    <button onClick={goToManage} className="text-sm text-white/40 hover:text-white transition-colors">
                                        Skip for now
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={selectedEmails.size + parseManualEmails(manualEmails).length === 0}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Next
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={pageState === "preview" && (isSending || selectedRecipients.length === 0)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {pageState === "preview" ? (
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
            </div>
        </div>
    );
}

function parseManualEmails(input: string): string[] {
    if (!input.trim()) return [];
    return input
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}
