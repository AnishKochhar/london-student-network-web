"use client";

import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { useParams } from "next/navigation";
import { Event } from "@/app/lib/types";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { base62ToBase16 } from "@/app/lib/utils/type-manipulation";
import { returnLogo } from "@/app/lib/utils/events";
import { EVENT_TAG_TYPES } from "@/app/lib/utils/events";
import { formatDateString } from "@/app/lib/utils/time";
import { LockClosedIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import EventInfoPageSkeleton from "@/app/components/skeletons/event-info-page";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getPublicStripePromise } from '@/app/lib/singletons-public';

const stripePromise = getPublicStripePromise();

type FormValues = {
	tickets: Record<string, number>; // Changed to object mapping ticket IDs to quantities
  };

// 2. Update SelectTicketComponent to use correct field names
function SelectTicketComponent({ event }: { event: Event }) {
	const { control, setValue } = useFormContext<FormValues>();
  
	return (
	  <div className="mt-6">
		<div className="w-full flex flex-col justify-center">
		  <h4 className="text-md font-semibold mb-2 text-gray-500">Select Ticket Type</h4>
		  {event.tickets_info.map((ticket) => {
			const isFree = (ticket.price || 0) <= 0;
			const isSoldOut = ticket.capacity !== null && ticket.capacity <= 0;
  
			return (
			  <div key={ticket.ticket_uuid} className="flex items-center mb-4 p-4 border rounded-lg">
				<div className="flex flex-col w-full">
				  <div className="flex justify-between items-center">
					<div className="flex items-center gap-4">
					  {isFree ? (
						<Controller
						  name={`tickets.${ticket.ticket_uuid}`}
						  control={control}
						  render={({ field }) => (
							<label className="flex items-center space-x-2">
							  <input
								type="checkbox"
								checked={field.value === 1}
								onChange={(e) => {
								  const isChecked = e.target.checked;
								  field.onChange(isChecked ? 1 : 0);
								  if (isChecked) {
									// Update other free tickets using UUIDs
									event.tickets_info.forEach((t) => {
									  if (t.ticket_uuid !== ticket.ticket_uuid && (t.price || 0) <= 0) {
										setValue(`tickets.${t.ticket_uuid}`, 0);
									  }
									});
								  }
								}}
								className="form-checkbox h-5 w-5 text-blue-600 rounded"
								disabled={isSoldOut}
							  />
							  <span className={`text-gray-700 ${isSoldOut ? 'opacity-50' : ''}`}>
								{ticket.ticketName} (Free)
							  </span>
							</label>
						  )}
						/>
					  ) : (
						<Controller
						  name={`tickets.${ticket.ticket_uuid}`}
						  control={control}
						  render={({ field }) => (
							<div className="flex items-center gap-2">
							  <input
								type="number"
								min="0"
								max={ticket.capacity}
								value={field.value === undefined || field.value === 0 ? '' : field.value.toString()}
								onChange={(e) => {
								  const value = Math.max(0, parseInt(e.target.value) || 0);
								  const max = ticket.capacity || Infinity;
								  field.onChange(Math.min(value, max));
								}}
								onFocus={(e) => {
								  if (e.target.value === '0') e.target.value = '';
								}}
								onBlur={(e) => {
								  if (e.target.value === '') e.target.value = '0';
								}}
								placeholder="0"
								className="w-20 px-2 py-1 border rounded text-black placeholder-gray-300"
								disabled={isSoldOut}
							  />
							  <span className={`text-gray-700 ${isSoldOut ? 'opacity-50' : ''}`}>
								{ticket.ticketName} - £{ticket.price}
							  </span>
							</div>
						  )}
						/>
					  )}
					</div>
					<span className={`text-sm ${isSoldOut ? 'text-red-500' : 'text-gray-500'}`}>
					  {isSoldOut ? 'Sold out' : 
					   ticket.capacity !== null ? 
					   `${ticket.capacity} available` : 'Unlimited'}
					</span>
				  </div>
				</div>
			  </div>
			);
		  })}
		</div>
	  </div>
	);
  }

export default function EventInfo() {
	const { id } = useParams() as { id: string };

	const event_id = base62ToBase16(id);
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [requiresPayment, setRequiresPayment] = useState<boolean>(false);
	const [ticketSelected, setTicketSelected] = useState<boolean>(false);
	const [ticketPrice, setTicketPrice] = useState<string>('0');
	const [showCheckout, setShowCheckout] = useState<boolean>(false);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const session = useSession();
	const loggedIn = session.status === 'authenticated';

	const modalref = useRef<HTMLDialogElement>(null);


	const methods = useForm<FormValues>({
		defaultValues: {
		  tickets: {}
		}
	});
  	const [totalSelected, setTotalSelected] = useState(0);


	useEffect(() => {
		const fetchData = async () => {
			const result = await fetchEventInformation(event_id)
			if (result?.tickets_price && parseFloat(result?.tickets_price) > 0) {
				setTicketPrice(result.tickets_price);
				setRequiresPayment(true);
			}
			setEvent(result);
		};
		fetchData();
	}, [id]);

	useEffect(() => {
		if (event) {
			console.log(event.tickets_info);
		}
	}, [event]);

	useEffect(() => {
		if (event) {
		  const initialValues = event.tickets_info.reduce((acc, ticket) => {
			acc[ticket.ticket_uuid] = 0;
			return acc;
		  }, {} as Record<string, number>);
		  
		  methods.reset({ tickets: initialValues });
		  setRequiresPayment(event.tickets_info.some(t => (t.price || 0) > 0));
		}
	  }, [event]);

	  useEffect(() => {
		const subscription = methods.watch((value) => {
		  const total = Object.values(value.tickets || {}).reduce((sum, quantity) => sum + (quantity || 0), 0);
		  setTotalSelected(total);
		});
		return () => subscription.unsubscribe();
	  }, [methods.watch]);


    // const handleSelect = () => {
    //     setTicketSelected(!ticketSelected);
    // };


	async function fetchEventInformation(id: string) {
		try {
			setLoading(true);
			const response = await fetch('/api/events/get-information', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id }),
			})

			if (!response.ok) {
				throw new Error('Failed to fetch an event information');
			}

			const data = await response.json();
			setLoading(false);
			return data;
		} catch (err) {
			console.error('Failed to fetch event information', err);
		} finally {
			setLoading(false);
		}
	}


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
				} else if (result.emailError) {
					toast.error('Failed to send confirmation emails!', { id: toastId })
				} else {
					toast.error('Error registering for event!', { id: toastId })
				}
			}
		} catch (error) {
			toast.error(`Error during event registration: ${error}.`, { id: toastId })
		}
	}

	const handleCloseModal = () => {
        setShowCheckout(false);
        modalref.current?.close();
    }

	const getTags = (eventType: number) => {
		const tags = [];
		for (const [key, value] of Object.entries(EVENT_TAG_TYPES)) {
			if (eventType & Number(key)) {
				tags.push(value);
			}
		}
		return tags;
	};

	// function SelectTicketComponent({event_id}: {event_id: string}) {
	// 	useEffect(() => {

	// 	})
	// 	return (
	// 		<div className="mt-6">
	// 			<div className="w-full flex flex-row justify-center">
	// 				<div className="flex flex-col items-center">
	// 					<h4 className="text-md font-semibold mb-2 text-gray-500">Select Ticket Type</h4>
	// 					<div className="flex items-center mb-4">
	// 						<input
	// 							type="checkbox"
	// 							id="ticket"
	// 							checked={ticketSelected}
	// 							onChange={handleSelect}
	// 							className="hidden"
	// 						/>
	// 						<label
	// 							htmlFor="ticket"
	// 							className={`flex items-center cursor-pointer p-2 border-2 rounded-full ${ticketSelected ? 'bg-green-500' : 'bg-white'}`}
	// 						>
	// 							<span className="text-gray-700">Standard Ticket - £{ticketPrice}</span> 
	// 							{/* show the different ticket types dynamically from api call */}
	// 							{/* capture the user selection of tickets + quantities with react hook form */}
	// 						</label>
	// 					</div>
	// 					<EmbeddedCheckoutButton event_id={event_id} ticketSelected={ticketSelected}/>
	// 				</div>
	// 			</div>
	// 		</div>
	// 	)
	// }


	const handleCheckout = async (data: FormValues) => {
		if (!loggedIn) {
			toast.error('Please log in to register for events')
			return
		}

		try {
			const toastId = toast.loading('Registering for event...')

			// Convert to ticket ID -> quantity mapping
			const ticketSelections = Object.entries(data.tickets)
				.filter(([_, quantity]) => quantity > 0)
				.reduce((acc, [ticketId, quantity]) => {
				acc[ticketId] = quantity;
				return acc;
				}, {} as Record<string, number>);
	
			console.log(ticketSelections);
			
			const response = await fetch('/api/events/register', {
				method: 'POST',
				headers: {
				'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					event_id: event.id,
					user_id: session.data.user.id,
					ticket_id_to_quantity: ticketSelections
				}),
			});
	
			const result = await response.json()
			if (!result.success) {
				toast.error(result.error, { id: toastId })
			} else {
				if (result.requiresPayment) {
					setClientSecret(result.client_secret);
					setShowCheckout(true);
					modalref.current?.showModal();
					toast.success('Please complete registration via secure checkout.', { id: toastId })
				} else { 
					toast.success('Successfully registered for event! Please check your email.', { id: toastId })
				}
			}
		} catch(error) {
			console.error('Error with checkout, when trying to register for an event');
			toast.error('Registration flow failed. Please get in touch if this was not expected.')
		}

	};


	// Handle loading and error states
	if (loading) {
		return (
			<EventInfoPageSkeleton />
		)
	}

	const societyLogo = returnLogo(event.organiser)


	// Render the event details
	return (
		<div className="relative w-full h-full m-[10px]">
			<div className="flex flex-col md:flex-row h-full overflow-y-auto">
				{/* Event Image  */}
				<div className="h-full md:w-1/2 mb-6 md:mb-0 md:mr-6 flex flex-col justify-between">
					<div className="relative w-full h-0 pb-[85%] overflow-hidden">
						<Image
							src={event.image_url}
							alt={event.title}
							width={200}
							height={200}
							className="absolute inset-0 w-[80%] h-[80%] left-[10%] object-contain border "
						/>
					</div>
					<div className="flex flex-col md:flex-row items-center">
						{societyLogo.found && (
							<Image
								src={societyLogo.src || '/images/societies/roar.png'}
								alt="Society Logo"
								width={50}
								height={50}
								className="object-contain mr-2"
							/>
						)}
						<p className="text-sm text-gray-500">
							<strong>Hosted by</strong> {event.organiser}
						</p>
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

							{/* Minimum Capacity */}
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

					{/* <div className='mt-6'>
						<h3 className="text-lg font-semibold mb-2 text-gray-500">Registration</h3>
						<hr className="border-t-1 border-gray-300 m-2" />
						<div className="w-full flex flex-row justify-center">
							{!loggedIn ? (
								<button className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
									onClick={registerForEvent}>
									<LockClosedIcon width={20} height={20} className='pr-2' />
									Press here to register to this event
								</button>
							) : (
								// requiresPayment ? (
								<SelectTicketComponent event={event}/>
								// ) : (
								// 	<button className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
								// 		onClick={registerForEvent}>
								// 		Press here to register to this event
								// 		<ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
								// 	</button>
								// )
							)}
						</div>
					</div> */}

					{/* <div className='mt-6'>
						<h3 className="text-lg font-semibold mb-2 text-gray-500">Registration</h3>
						<hr className="border-t-1 border-gray-300 m-2" />
						<div className="w-full flex flex-row justify-center">
						{!loggedIn ? (
							<button className="..." onClick={registerForEvent}>
							<LockClosedIcon width={20} height={20} className='pr-2' />
							Press here to register to this event
							</button>
						) : requiresPayment ? (
							<FormProvider {...methods}>
								<form onSubmit={methods.handleSubmit(handleCheckout)} className="w-full">
									<SelectTicketComponent event={event!} />
									<button
									type="submit"
									disabled={totalSelected === 0}
									className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
									>
									Proceed to Checkout ({totalSelected} selected)
									</button>
								</form>
							</FormProvider>
						) : (
							<button className="..." onClick={registerForEvent}>
							Press here to register to this event
							<ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
							</button>
						)}
						</div>
					</div> */}
					<div className='mt-6'>
						<h3 className="text-lg font-semibold mb-2 text-gray-500">Registration</h3>
						<hr className="border-t-1 border-gray-300 m-2" />
						<div className="w-full flex flex-row justify-center">
							{!loggedIn ? (
								<button 
								className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
								onClick={registerForEvent}>
									<LockClosedIcon width={20} height={20} className='pr-2' />
									Press here to register
								</button>
							) : (
								<>
									<FormProvider {...methods}>
										<form onSubmit={methods.handleSubmit(handleCheckout)} className="w-full">
										<SelectTicketComponent event={event!} />
										<button
											type="submit"
											disabled={totalSelected === 0}
											className="btn btn-primary w-full mt-4"
										>
											{requiresPayment ? 'Proceed to Checkout' : 'Complete Registration'} 
											({totalSelected} selected)
										</button>
										</form>
									</FormProvider>
									<dialog ref={modalref} className="modal">
										<div className="modal-box flex flex-col">
											<div className="modal-action">
												<button
													className="btn" 
													onClick={() => {
													handleCloseModal();
													modalref.current?.close();
													}}
												>
													Close
												</button>
											</div>
											{(showCheckout && clientSecret) && (
											<EmbeddedCheckoutProvider 
												stripe={stripePromise} 
												options={{ clientSecret }}
											>
												<EmbeddedCheckout className="h-full" />
											</EmbeddedCheckoutProvider>
											)}
										</div>
									</dialog>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

