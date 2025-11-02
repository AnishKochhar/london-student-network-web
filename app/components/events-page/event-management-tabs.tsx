"use client";

import { useState } from "react";
import { Event } from "@/app/lib/types";
import GlassTabPicker from "./management-tabs/glass-tab-picker";
import OverviewTab from "./management-tabs/overview-tab";
import GuestsTab from "./management-tabs/guests-tab";
import RegistrationTab from "./management-tabs/registration-tab";
import InsightsTab from "./management-tabs/insights-tab";
import { ManagementDataProvider } from "./management-tabs/data-provider";

interface EventManagementTabsProps {
    event: Event;
    eventId: string;
    onEventUpdate: () => void;
}

type TabType = "overview" | "guests" | "registration" | "insights";

export default function EventManagementTabs({ event, eventId, onEventUpdate }: EventManagementTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    const hasPaidTickets = event.tickets?.some((t: { ticket_price?: string }) => {
        const price = parseFloat(t.ticket_price || '0');
        return price > 0;
    }) || false;

    return (
        <ManagementDataProvider eventId={eventId} hasPaidTickets={hasPaidTickets}>
            <div className="space-y-6">
                {/* Glass Tab Navigation */}
                <GlassTabPicker activeTab={activeTab} setActiveTab={setActiveTab as (tab: string) => void} />

                {/* Tab Content */}
                <div className="min-h-[600px]">
                    {activeTab === "overview" && (
                        <OverviewTab event={event} eventId={eventId} onEventUpdate={onEventUpdate} />
                    )}
                    {activeTab === "guests" && (
                        <GuestsTab event={event} eventId={eventId} />
                    )}
                    {activeTab === "registration" && (
                        <RegistrationTab event={event} eventId={eventId} />
                    )}
                    {activeTab === "insights" && (
                        <InsightsTab event={event} eventId={eventId} />
                    )}
                </div>
            </div>
        </ManagementDataProvider>
    );
}
