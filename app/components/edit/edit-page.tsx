"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import EditEventComponent from "@/app/components/events-page/edit-event";
import { Event, DefaultEvent } from "@/app/lib/types";

export default function EditPageComponent() {

	const searchParams = useSearchParams();

	const [event, setEvent] = useState<Event>(DefaultEvent)

	useEffect(() => {
		const data = searchParams.get('data')
		if (data) {
			try {
				const decodedData = decodeURIComponent(data as string)
				const parsedEvent: Event = JSON.parse(decodedData)
				setEvent(parsedEvent)
			} catch (error) {
				console.error('Error decoding event data:', error)
			}
		}
	}, [searchParams]);

	if (!event) return <LoadingScreen />

	return (
		<EditEventComponent event={event} />
	)
}


function LoadingScreen() {
	return (
		<main className="min-h-screen w-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
			<div className="flex flex-col items-center justify-center">
				<h1 className="text-3xl">Loading...</h1>
			</div>
		</main>
	)
}