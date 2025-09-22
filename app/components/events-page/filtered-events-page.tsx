"use client";

import { useState } from "react";
import { Event } from "@/app/lib/types";
import TagButtons from "./event-tag-filters";
import { EVENT_TAG_TYPES } from "@/app/lib/utils";
import FilteredEventsList from "./filtered-events-list";
import EventSearchBar from "./event-search-bar";
import { SegmentedToggle } from "../ui/segmented-toggle";

interface FilteredEventsPageProps {
    allEvents: Event[];
    editEvent?: boolean;
}

export default function FilteredEventsPage({
    allEvents,
    editEvent,
}: FilteredEventsPageProps) {
    const initialActiveTags = Object.keys(EVENT_TAG_TYPES).map((tag) =>
        parseInt(tag, 10),
    );
    const [activeTags, setActiveTags] = useState<number[]>(initialActiveTags);
    const [searchQuery, setSearchQuery] = useState("");
    const [eventSource, setEventSource] = useState<"all" | "society" | "student_union">("all");

    const toggleTag = (tag: number) => {
        setActiveTags((prevTags) =>
            prevTags.includes(tag)
                ? prevTags.filter((t) => t !== tag)
                : [...prevTags, tag],
        );
    };

    // Filter events by event source (society vs student union)
    const sourceFilteredEvents = allEvents.filter((event) => {
        if (eventSource === "all") return true;
        if (eventSource === "student_union") return event.student_union === true;
        if (eventSource === "society") return !event.student_union;
        return true;
    });

    // Filter events by search query
    const searchFilteredEvents = sourceFilteredEvents.filter((event) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            event.title.toLowerCase().includes(query) ||
            event.organiser.toLowerCase().includes(query) ||
            event.location_area.toLowerCase().includes(query) ||
            event.location_building.toLowerCase().includes(query)
        );
    });

    const segmentedToggleOptions = [
        { label: "All Events", value: "all" },
        { label: "Society Events", value: "society" },
        { label: "Student Union Events", value: "student_union" },
    ];

    return (
        <>
            <EventSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <div className="flex justify-center mb-6">
                <SegmentedToggle
                    options={segmentedToggleOptions}
                    value={eventSource}
                    onValueChange={(value) => setEventSource(value as "all" | "society" | "student_union")}
                />
            </div>

            <TagButtons activeTags={activeTags} toggleTag={toggleTag} />
            <FilteredEventsList
                allEvents={searchFilteredEvents}
                activeTags={activeTags}
                editEvent={editEvent}
            />
        </>
    );
}
