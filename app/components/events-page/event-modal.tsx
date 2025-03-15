"use client";

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { EventModalProps } from "@/app/lib/types";
import { createPortal } from 'react-dom';
import { EVENT_TAG_TYPES, returnLogo } from '@/app/lib/utils/events';
import { formatDateString } from '@/app/lib/utils/time';
import { Button } from '../button';
import { useRouter } from 'next/navigation';
import { base16ToBase62 } from '@/app/lib/utils/type-manipulation';


export default function EventModal({ event, onClose }: EventModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const jumpToEvent = () => router.push(`/events/${base16ToBase62(event.id)}`)

	// Disable background scroll and handle outside click detection
	useEffect(() => {
		// Prevent background scrolling
		document.body.style.overflow = 'hidden';

		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.body.style.overflow = '';
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	const getTags = (eventType: number) => {
		const tags = [];
		for (const [key, value] of Object.entries(EVENT_TAG_TYPES)) {
			if (eventType & Number(key)) {
				tags.push(value);
			}
		}
		return tags;
	};

	const societyLogo = returnLogo(event.organiser)


	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div
				ref={modalRef}
				className="relative bg-white w-[90vw] h-[80vh] p-8 border-2 border-black overflow-hidden"
			>
				<button onClick={onClose} className="absolute top-4 right-4 transition" >
					<Image
						src="/icons/close.svg"
						alt="Close"
						width={12}
						height={12}
						className="hover:brightness-75"
					/>
				</button>

				<div className="flex flex-col md:flex-row h-full overflow-y-auto">
					{/* Event Image  */}
					<div className="h-full md:w-1/2 mb-6 md:mb-0 md:mr-6 flex flex-col justify-between">
						<Image
							src={event.image_url}
							alt={event.title}
							width={200}
							height={200}
							className="w-[90%] h-64 object-contain"
						/>
						<div className='flex flex-col'>
							{societyLogo.found && (
								<Image
									src={societyLogo.src || '/images/societies/roar.png'}
									alt="Society Logo"
									width={50}
									height={50}
									className='object-contain mt-4'
								/>
							)}
							<p className="text-sm text-gray-500 mt-2"><strong>Hosted by</strong> {event.organiser}</p>
						</div>
					</div>

					{/* Event Details */}
					<div className="md:w-1/2">
						<div className="flex flex-col md:flex-row mb-2 md:mb-0 justify-between items-center">
							<div className="mb-0">
								{getTags(event.event_type).map((tag, index) => (
									<span key={index} className={`inline-block px-3 py-1 text-xs text-white ${tag.color} rounded-full mr-2 lowercase`}>
										{tag.label}
									</span>
								))}

							</div>
							<button 
								className="flex items-center rounded-lg px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider  hover:text-black transition-transform duration-300 ease-in-out"
								onClick={jumpToEvent}
							>							
								Go To Event
								<ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
							
							</button>
						</div>

						<h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
						<p className="text-gray-700 capitalize italic">{formatDateString(event.date, false)} | {event.time}</p>
						<p className="text-sm :text-lg text-gray-700 mt-2">{event.location_building}</p>
						<p className="text-sm :text-lg text-gray-600">{event.location_area}</p>
						<p className="text-sm :text-lg text-gray-500">{event.location_address}</p>

						{/* {event.capacity && (
							<p className="text-sm :text-lg text-gray-900 mt-1">Venue capacity: {event.capacity}</p>
						)} */}

						{event.tickets_info?.length > 0 && (
							<div className="mt-4 space-y-2">
								<h3 className="text-sm font-semibold text-gray-900">Tickets Available:</h3>
								<div className="space-y-1">
								{event.tickets_info.map((ticket, index) => (
									<div key={index} className="flex justify-between items-center">
									<span className="text-sm text-gray-700">
										{ticket.ticketName}
										{ticket.price !== null && ticket.price > 0 ? (
										<span className="ml-2 text-gray-500">
											(£{(ticket.price)})
										</span>
										) : (
										<span className="ml-2 text-gray-500">(Free)</span>
										)}
									</span>
									<span className="text-sm text-gray-700">
										{ticket.capacity !== null ? 
										ticket.capacity.toLocaleString() : 
										'Unlimited'}
									</span>
									</div>
								))}
								</div>

								{/* Total Capacity */}
								{event.tickets_info.some(t => t.capacity !== null) && (
								<p className="text-sm text-gray-900 pt-2 border-t mt-2">
									Minimum venue capacity: {
									event.tickets_info.reduce((sum, ticket) => 
										sum + (ticket.capacity || 0), 0
									).toLocaleString()
									}
								</p>
								)}
							</div>
						)}

						<div className="mt-6">
							<h3 className="text-lg font-semibold mb-2 text-gray-500">About the Event</h3>
							<hr className="border-t-1 border-gray-300 m-2" />
							<p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
						</div>

						{event.for_externals && (
							<div className='mt-6'>
								<h3 className="text-lg font-semibold mb-2 text-gray-500">Information for external students</h3>
								<hr className="border-t-1 border-gray-300 m-2" />
								<p className="text-gray-600">{event.for_externals}</p>
							</div>
						)}

						<div className='mt-6'>
							<h3 className="text-lg font-semibold mb-2 text-gray-500">Registration</h3>
							<hr className="border-t-1 border-gray-300 m-2" />
							<div className="w-full flex flex-row justify-center">
								<Button
									variant='ghost'
									size='lg'
									className="text-gray-600 text-lg uppercase tracking-wider px-20 hover:text-gray-600 transition-transform duration-300 ease-in-out hover:scale-105"
									onClick={jumpToEvent}
								>
									Press here to register to this event 
									<ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
								</Button>
							</div>
						</div>



					</div>
				</div>
			</div>
		</div>,
		document.body
	);
}
