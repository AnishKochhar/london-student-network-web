'use client'


import { getPublicStripePromise } from "@/app/lib/singletons-public";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { Button } from '@/app/components/button';


const stripePromise = getPublicStripePromise();

export default function EmbeddedCheckoutButton({ event_id, ticketSelected }: { event_id: string, ticketSelected: boolean }) {

	const [showCheckout, setShowCheckout] = useState<boolean>(false);
	const modalref = useRef<HTMLDialogElement>(null);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [price_id, setPrice_id] = useState<string>('');
	const prevEventIdRef = useRef<string | null>(null);

	useEffect(() => { // debouncer stops excesive fetching
		const fetchPrice = debounce(async () => {
			console.log('fetching price for event', event_id);
			if (event_id && event_id.trim() !== '' && event_id !== prevEventIdRef.current) {
				try {
					const result = await fetchPriceId(event_id);
					setPrice_id(result?.priceID || '');
					prevEventIdRef.current = event_id;
				} catch (error) {
					console.error('Error fetching price ID:', error);
				}
			}
		}, 300); // Debounce delay of 300ms

		fetchPrice();

		return () => {
			fetchPrice.cancel();
		};
	}, [event_id]);


	useEffect(() => {
		const fetchClientSecret = async () => {
			try {
				console.log('price_id', price_id);
				const response = await fetch("/api/payments/directed-checkout-sessions", {
					method: "POST",
					headers: {
						"Content-Type": "applications/json",
					},
					body: JSON.stringify({ priceId: price_id, eventId: event_id }),
				})
				const data = await response.json();
				console.log('data', data);
				setClientSecret(data.client_secret);
			} catch (error) {
				console.log('An error has occured with creating a checkout session:', error);
			}
		};

		if (price_id && price_id !== '') {
			fetchClientSecret();
		}
	}, [price_id])


	const handleCheckoutClick = () => {
		setShowCheckout(true);
		modalref.current?.showModal();
	}

	const handleCloseModal = () => {
		setShowCheckout(false);
		modalref.current?.close();
	}

	async function fetchPriceId(id: string) {
		try {

			const response = await fetch('/api/payments/fetch-price-id', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ event_uuid: id }),
			})

			if (!response.ok) {
				throw new Error('Failed to fetch price id');
			}

			const data = await response.json();

			return data;
		} catch (err) {
			console.error('Failed to retrieve price id:', err);
		}
	}

	return (
		<div id="checkout" className="max-w-full px-4">
			{/* Checkout Button */}
			<Button
				variant="filled"
				onClick={handleCheckoutClick}
				disabled={!ticketSelected}
				className="w-full mt-2"
			>
				Proceed to Secure Checkout
			</Button>

			{/* Modal */}
			<dialog ref={modalref} className="modal">
				<div className="modal-box">
					<div className="modal-action">
						<Button variant="outline" onClick={handleCloseModal}>Close</Button>
					</div>
					<h2 className="text-2xl font-bold text-center mb-4">Secure Checkout</h2>

					{/* Embedded Checkout Component */}
					{(showCheckout && clientSecret) && (
						<EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
							<EmbeddedCheckout />
						</EmbeddedCheckoutProvider>
					)}
				</div>
			</dialog>
		</div>
	)
}
