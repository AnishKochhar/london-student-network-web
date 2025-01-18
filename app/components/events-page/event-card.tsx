"use client";


import Image from "next/image";
import { useState } from "react";
import { Event } from "@/app/lib/types";
import { formatDateString } from "@/app/lib/utils";
import EventCardTags from "./event-tags";
import EventModal from "./event-modal";
import { useRouter } from 'next/navigation';
import EditPage from "@/app/events/edit/page";


interface EventCardProps {
	event: Event
	editEvent?: boolean
}

export default function EventCard({ event, editEvent }: EventCardProps) {
	const [modalChoice, setModalChoice] = useState<'edit' | 'view' | 'waiting'>('waiting');


	const router = useRouter()

	const openEditModal = () => setModalChoice('edit');
	const openViewModal = () => setModalChoice('view');
	const closeModal = () => setModalChoice('waiting');

	// const navigateToEdit = () => {
	// 	try {
	// 		const data = { id: event.id };
	// 		router.push(`/events/edit?data=${data}`)
	// 	} catch (error) {
	// 		console.error("Error encoding event data:", error)
	// 	}
	// }


	const handleCardClick = () => {
		{!editEvent? openViewModal() : openEditModal()} // !editEvent is the most likely scenario
	};

	if (modalChoice === 'view') {
		return <EventModal event={event} onClose={closeModal} />;
	}

	if (modalChoice === 'edit') {
		return <EditPage eventProp={event} onClose={closeModal} />;
	}


	return (
		<>

			<div 
				className="flex flex-col p-4 rounded-sm shadow-lg relative transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-opacity-90 bg-white" 
				onClick={handleCardClick}
			>
				<EventCardTags eventType={event.event_type} />
				<Image
					src={event.image_url}
					alt={event.title}
					width={200}
					height={40}
					className={`w-full h-40 ${event.image_contain ? 'object-contain' : 'object-cover'} mb-1 border border-black`}
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
		</>
	)
}