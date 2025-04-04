"use client";

import { useState } from "react";
import { Event } from "@/app/lib/types";
import TagButtons from "./event-tag-filters";
import { EVENT_TAG_TYPES } from "@/app/lib/utils/events";
import FilteredEventsList from "./filtered-events-list";

interface FilteredEventsPageProps {
	allEvents: Event[]
	editEvent?: boolean
}

export default function FilteredEventsPage({ allEvents, editEvent }: FilteredEventsPageProps) {
	const initialActiveTags = Object.keys(EVENT_TAG_TYPES).map(tag => parseInt(tag, 10));
	const [activeTags, setActiveTags] = useState<number[]>(initialActiveTags);

	const toggleTag = (tag: number) => {
		setActiveTags((prevTags) =>
			prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
		);
	};

	return (
		<>
			<TagButtons activeTags={activeTags} toggleTag={toggleTag} />
			<FilteredEventsList allEvents={allEvents} activeTags={activeTags} editEvent={editEvent} />
		</>
	)
}