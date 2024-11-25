"use client";

import Image from "next/image";
import { useState } from "react";
import { Event } from "@/app/lib/types";
import { formatDateString } from "@/app/lib/utils";
import EventCardTags from "./event-tags";
import EventModal from "./event-modal";
import { useRouter } from 'next/navigation';

interface EventCardProps {
	event: Event
	editEvent?: boolean
}

export default function EventCard({ event, editEvent }: EventCardProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const router = useRouter()

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => setIsModalOpen(false);

	const navigateToEdit = () => {
		try {
			const eventData = encodeURIComponent(JSON.stringify(event))
			router.push(`/events/edit?data=${eventData}`)
		} catch (error) {
			console.error("Error encoding event data:", error)
		}
	}


	return (
		<>

			<div className="flex flex-col p-4 rounded-sm shadow-lg relative transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-opacity-90 bg-white" onClick={editEvent ? navigateToEdit : openModal}>
				<EventCardTags eventType={event.event_type} />
				<Image
					src={event.image_url}
					alt={event.title}
					width={200}
					height={40}
					className="w-full h-40 object-cover mb-1 border border-black"
				/>
				<div className="flex flex-col justify-between flex-grow">
					<div>
						<p className="text-gray-700 text-sm uppercase">{formatDateString(event.date)} |  {event.time}</p>
						<h3 className="text-slate-700 text-xl font-bold mt-2 mb-2 line-clamp-3">{event.title}</h3>
					</div>
					<div>
						<p className="text-gray-500 text-xs ">{event.location_area}</p>
						<p className="text-black text-right mt-2 truncate text-ellipsis">{event.organiser}</p>
					</div>
				</div>
			</div>
			{isModalOpen && <EventModal event={event} onClose={closeModal} />}
		</>
	)
}