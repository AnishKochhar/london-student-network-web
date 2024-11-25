"use client";

import Image from 'next/image';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Event } from "@/app/lib/types";
import { createPortal } from 'react-dom';
import { formatDateString, EVENT_TAG_TYPES, returnLogo } from '@/app/lib/utils';
import { useSession } from 'next-auth/react';
import { Button } from '../button';

interface EventModalProps {
	event: Event;
	onClose: () => void;
}

export default function EventModal({ event, onClose }: EventModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const session = useSession();
	const loggedIn = session.status === 'authenticated';

	const registerForEvent = async () => {
		if (!loggedIn) {
			toast.error('Please log in to register for events')
			return
		}
		const toastId = toast.loading('Registering for event...')
		// Check if they are already registered
		try {
			const res = await fetch('/api/events/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					event_id: event.id,
					user_information: session.data.user
				}),
			})

			const result = await res.json();
			if (result.success) {
				toast.success('Successfully registered for event!', { id: toastId })
			} else {
				if (result.registered) {
					toast.error('Already registered for the event!', { id: toastId })
				} else {
					toast.error('Error registering for event!', { id: toastId })
				}
			}
		} catch (error) {
			toast.error(`Error during event registration: ${error}.`, { id: toastId })
		}
	}

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
							className="w-[90%] h-64 object-cover border-2  border-black/70"
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
						<div className="mb-4">
							{getTags(event.event_type).map((tag, index) => (
								<span key={index} className={`inline-block px-3 py-1 text-xs text-white ${tag.color} rounded-full mr-2 lowercase`}>
									{tag.label}
								</span>
							))}
						</div>

						<h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
						<p className="text-gray-700 capitalize italic">{formatDateString(event.date, false)} | {event.time}</p>
						<p className="text-sm :text-lg text-gray-700 mt-2">{event.location_building}</p>
						<p className="text-sm :text-lg text-gray-600">{event.location_area}</p>
						<p className="text-sm :text-lg text-gray-500">{event.location_address}</p>

						{event.capacity && (
							<p className="text-sm :text-lg text-gray-900 mt-1">Venue capacity: {event.capacity}</p>
						)}

						<div className="mt-6">
							<h3 className="text-lg font-semibold mb-2 text-gray-500">About the Event</h3>
							<hr className="border-t-1 border-gray-300 m-2" />
							<p className="text-gray-600">{event.description}</p>
						</div>

						{event.for_externals && (
							<div className='mt-6'>
								<h3 className="text-lg font-semibold mb-2 text-gray-500">Information for external students</h3>
								<hr className="border-t-1 border-gray-300 m-2" />
								<p className="text-gray-600">{event.for_externals}</p>
							</div>
						)}

						
						<div className="mt-10 self-end w-full flex flex-row justify-end pr-2">
							<Button
								variant='filled'
								size='lg'
								className="text-gray-600 text-lg rounded-none  border-[#e2531f] uppercase font-semibold tracking-widest px-20"
								onClick={registerForEvent}
							>
								{!loggedIn && <LockClosedIcon width={20} height={20}  className='pr-2'/> }
								Register through LSN
							</Button>
						</div>
						

						
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
}
