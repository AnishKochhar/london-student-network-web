"use client";

import { useParams } from "next/navigation";
import { Event } from "@/app/lib/types";
import { useEffect, useState } from "react";
import Image from "next/image";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { EVENT_TAG_TYPES, returnLogo, formatDateString } from "@/app/lib/utils";
import { LockClosedIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import EventInfoPageSkeleton from "@/app/components/skeletons/event-info-page";
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

export default function EventInfo() {
	const { id } = useParams() as { id: string };

	const event_id = base62ToBase16(id);
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [requiresPayment, setRequiresPayment] = useState<boolean>(false);
	const [ticketSelected, setTicketSelected] = useState<boolean>(false);
	const [ticketPrice, setTicketPrice] = useState<string>('0');
	const session = useSession();
	const loggedIn = session.status === 'authenticated';

	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [stripe, setStripe] = useState<Stripe | null>(null);
	const [elements, setElements] = useState<StripeElements | null>(null);
  
	useEffect(() => {
	  // Load Stripe.js asynchronously and initialize the Stripe object
	  const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY!);
	  stripePromise.then((stripeInstance) => {
		setStripe(stripeInstance);
		setElements(stripeInstance?.elements());
	  });
  
	  // Fetch the client secret from the backend
	  const createPaymentIntent = async () => {
		const response = await fetch('/api/create-payment-intent', {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify({ amount: 0 }), // $0.01 in cents
		});
		const data = await response.json();
		setClientSecret(data.clientSecret);
	  };
  
	  createPaymentIntent();
	}, []);
  
	const proceedToCheckout = async (event: React.FormEvent) => {
	  event.preventDefault();
  
	  if (stripe && elements && clientSecret) {
		const cardElement = elements.getElement('card');
		
		if (cardElement) {
		  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
			  card: cardElement,
			  billing_details: {
				name: 'Your Name',
			  },
			},
		  });
  
		  if (error) {
			console.error('Payment failed:', error.message);
		  } else {
			console.log('Payment succeeded:', paymentIntent);
		  }
		}
	  }
	};
	

	useEffect(() => {
		console.log(requiresPayment, ticketPrice, ticketSelected);
	}, [requiresPayment, ticketPrice, ticketSelected])


	useEffect(() => {
		const fetchData = async () => {
			const result = await fetchEventInformation(event_id)
			// console.log(result)
			if (result?.tickets_price && parseFloat(result?.tickets_price) > 0) {
				setTicketPrice(result.tickets_price);
				setRequiresPayment(true);
			}
			setEvent(result);
		};
		fetchData();
	}, [id]);


    const handleSelect = () => {
        setTicketSelected(!ticketSelected);
    };


    // const proceedToCheckout = async () => {
	// 	try {

	// 		// 1. Call your backend to create the checkout session
	// 		const res = await fetch('/api/create-checkout-session', {
	// 		  method: 'POST',
	// 		  headers: {
	// 			'Content-Type': 'application/json',
	// 		  },
	// 		  body: JSON.stringify({
	// 			productId: 'your-product-id',
	// 			quantity: 1,
	// 		  }),
	// 		});
		
	// 		const responseSession = await res.json();
		
	// 		if (responseSession.id) {
	// 		  // 2. Redirect to Stripe's checkout page
	// 		  const stripe = await loadStripe('your-public-key-here');
	// 		  const { error } = await stripe.redirectToCheckout({
	// 			sessionId: responseSession.id,
	// 		  });
		
	// 		  if (error) {
	// 			console.error('Error redirecting to checkout:', error);
	// 		  }
	// 		}
	// 	  } catch (error) {
	// 		console.error
    // 	};
	// }


	async function fetchEventInformation(id: string) {
		try {
			setLoading(true)
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

			return data;
		} catch (err) {
			console.error('Failed to fetch event information', err);
		} finally {
			setLoading(false)
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
				} else {
					toast.error('Error registering for event!', { id: toastId })
				}
			}
		} catch (error) {
			toast.error(`Error during event registration: ${error}.`, { id: toastId })
		}
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

	const SelectTicketComponent = () => (
		<div className="mt-6">

				<div className="w-full flex flex-row justify-center">
					<div className="flex flex-col items-center">
						<h4 className="text-md font-semibold mb-2 text-gray-500">Select Ticket Type</h4>
						<div className="flex items-center mb-4">
							<input
								type="checkbox"
								id="ticket"
								checked={ticketSelected}
								onChange={handleSelect}
								className="hidden"
							/>
							<label
								htmlFor="ticket"
								className={`flex items-center cursor-pointer p-2 border-2 rounded-full ${ticketSelected ? 'bg-green-500' : 'bg-white'}`}
							>
								<span className="text-gray-700">Standard Ticket - £{ticketPrice}</span>
							</label>
						</div>
						<button
							className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
							onClick={(event) => proceedToCheckout(event)}
							disabled={!ticketSelected}
						>
							Proceed to Secure Checkout
						</button>
					</div>
				</div>
		</div>
	)


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

					{event.capacity && (
						<p className="text-sm :text-lg text-gray-900 mt-1">Venue capacity: {event.capacity}</p>
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
							{!loggedIn ? (
								<button className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
									onClick={registerForEvent}>
									<LockClosedIcon width={20} height={20} className='pr-2' />
									Press here to register to this event
								</button>
							) : (
								requiresPayment ? (
									<SelectTicketComponent />
								) : (
									<button className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
										onClick={registerForEvent}>
										Press here to register to this event
										<ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
									</button>
								)
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
