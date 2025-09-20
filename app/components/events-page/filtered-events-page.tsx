"use client";

import { useState } from "react";
import { Event } from "@/app/lib/types";
import TagButtons from "./event-tag-filters";
import { EVENT_TAG_TYPES } from "@/app/lib/utils";
import FilteredEventsList from "./filtered-events-list";
import EventSearchBar from "./event-search-bar";

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

    const toggleTag = (tag: number) => {
        setActiveTags((prevTags) =>
            prevTags.includes(tag)
                ? prevTags.filter((t) => t !== tag)
                : [...prevTags, tag],
        );
    };

    // Filter events by search query
    const searchFilteredEvents = allEvents.filter((event) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            event.title.toLowerCase().includes(query) ||
            event.organiser.toLowerCase().includes(query) ||
            event.location_area.toLowerCase().includes(query) ||
            event.location_building.toLowerCase().includes(query)
        );
    });

    return (
        <>
            <EventSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />
            <TagButtons activeTags={activeTags} toggleTag={toggleTag} />
            <FilteredEventsList
                allEvents={searchFilteredEvents}
                activeTags={activeTags}
                editEvent={editEvent}
            />
        </>
    );
}
