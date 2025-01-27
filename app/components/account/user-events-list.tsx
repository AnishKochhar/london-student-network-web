"use client";

import { useState, useEffect } from "react";
import FilteredEventsList from "../events-page/filtered-events-list";
import { Event } from "@/app/lib/types";
import { UserEventsListProps } from "@/app/lib/types";


export default function UserEventsList({ user_id, editEvent = false }: UserEventsListProps) {
	const [userEvents, setUserEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchUserEvents = async () => {
			try {
				const response = await fetch('/api/account/events', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ user_id }),
				});

				if (!response.ok) {
					throw new Error('Failed to fetch user events');
				}

				const events = await response.json();
				setUserEvents(events);
			} catch (error) {
				console.error('Error fetching user events:', error);
				setError('Failed to load events');
			} finally {
				setLoading(false);
			}
		};

		fetchUserEvents();
	}, [user_id]);

	if (loading) {
		return <p>Loading events...</p>;
	}

	if (error) {
		return <p>{error}</p>;
	}

	if (userEvents.length === 0) {
		return(
			<div className="flex justify-start">
				<p>No Events Found! (yet...)</p>
			</div>
		);
	}

	return (
		<div>
			<FilteredEventsList 
				allEvents={userEvents} 
				activeTags={[1, 2, 4]} // MARK: UPDATE if TAGS change
				editEvent={editEvent}
			/>
		</div>
	);
}
