'use client'


import getStripe from "@/app/lib/stripe_config";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCallback, useEffect, useRef, useState } from 'react';


export default function EmbeddedCheckoutButton({event_id, ticketSelected}: {event_id: string, ticketSelected: boolean}) {
    const stripePromise = getStripe()
    const [showCheckout, setShowCheckout] = useState<boolean>(false);
    const modalref = useRef<HTMLDialogElement>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [price_id, setPrice_id] = useState<string>('');


    useEffect(() => {
		const fetchPrice = async () => {
			const result = await fetchPriceId(event_id)
			setPrice_id(result?.priceID || '')
		};
		fetchPrice();
	}, [event_id])


    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const response = await fetch("/api/payments/checkout-sessions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "applications/json",
                    },
                    body: JSON.stringify({ priceId: price_id }),
                })
                const data = await response.json();
                setClientSecret(data.client_secret);
            } catch(error) {
                console.log('an error has occured with creating a checkout session:', error);
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
            <button
                className="btn btn-primary w-full text-sm font-light mt-2 hover:bg-purple-800"
                onClick={handleCheckoutClick}
                disabled={!ticketSelected}
            >
                Proceed to Secure Checkout
            </button>

            {/* Modal */}
            <dialog ref={modalref} className="modal">
                <div className="modal-box">
                    <div className="modal-action">
                        <button className="btn" onClick={handleCloseModal}>Close</button>
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