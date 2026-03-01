"use client";

import { useState } from "react";
import { Event, CoHostPermissions } from "@/app/lib/types";
import GlassTabPicker from "./management-tabs/glass-tab-picker";
import OverviewTab from "./management-tabs/overview-tab";
import GuestsTab from "./management-tabs/guests-tab";
import RegistrationTab from "./management-tabs/registration-tab";
import InsightsTab from "./management-tabs/insights-tab";
import CoHostsTab from "./management-tabs/cohosts-tab";
import { ManagementDataProvider } from "./management-tabs/data-provider";

interface EventManagementTabsProps {
    event: Event;
    eventId: string;
    onEventUpdate: () => void;
    isPrimary?: boolean;
    permissions?: CoHostPermissions;
}

type TabId = "overview" | "guests" | "registration" | "insights" | "cohosts";

export default function EventManagementTabs({
    event, eventId, onEventUpdate, isPrimary = false,
    permissions = { can_edit: true, can_manage_registrations: true, can_manage_guests: true, can_view_insights: true },
}: EventManagementTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>("overview");

    const hasPaidTickets = event.tickets?.some((t: { ticket_price?: string }) => {
        const price = parseFloat(t.ticket_price || '0');
        return price > 0;
    }) || false;

    // Determine which tabs are visible based on role + permissions
    const visibleTabs: TabId[] = ["overview"]; // Always visible
    if (isPrimary || permissions.can_manage_guests) visibleTabs.push("guests");
    if (isPrimary || permissions.can_manage_registrations) visibleTabs.push("registration");
    if (isPrimary || permissions.can_view_insights) visibleTabs.push("insights");
    visibleTabs.push("cohosts"); // Always visible (read-only for non-primary)

    // If the active tab was hidden (e.g. permissions changed), reset to overview
    const safeActiveTab = visibleTabs.includes(activeTab) ? activeTab : "overview";

    return (
        <ManagementDataProvider eventId={eventId} hasPaidTickets={hasPaidTickets}>
            <div className="space-y-6">
                {/* Glass Tab Navigation */}
                <GlassTabPicker
                    activeTab={safeActiveTab}
                    setActiveTab={setActiveTab as (tab: string) => void}
                    visibleTabs={visibleTabs}
                />

                {/* Tab Content */}
                <div className="min-h-[600px]">
                    {safeActiveTab === "overview" && (
                        <OverviewTab event={event} eventId={eventId} onEventUpdate={onEventUpdate} />
                    )}
                    {safeActiveTab === "guests" && (
                        <GuestsTab event={event} eventId={eventId} />
                    )}
                    {safeActiveTab === "registration" && (
                        <RegistrationTab event={event} eventId={eventId} />
                    )}
                    {safeActiveTab === "insights" && (
                        <InsightsTab event={event} eventId={eventId} />
                    )}
                    {safeActiveTab === "cohosts" && (
                        <CoHostsTab event={event} eventId={eventId} onEventUpdate={onEventUpdate} isPrimary={isPrimary} />
                    )}
                </div>
            </div>
        </ManagementDataProvider>
    );
}
