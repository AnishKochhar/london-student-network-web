'use client'


import getStripe from "@/app/lib/stripe_config";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCallback, useRef, useState } from 'react';


export default function EmbeddedCheckoutButton() {
    const stripePromise = getStripe()
    const [showCheckout, setShowCheckout] = useState<boolean>(false);
    const modalref = useRef<HTMLDialogElement>(null);

    const fetchClientSecret = useCallback(async () => {
        try {
            return fetch("/api/payments/checkout-sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "applications/json",
                },
                body: JSON.stringify({ priceId: 'price_1Qk0N9C8SmJJFioPHSehkaor'})
            })
                .then((res) => res.json())
                .then((data) => data.client_secret);
        } catch {
            console.log('an error has occured with creating a checkout session')
        }
    }, []);

    const options = { fetchClientSecret };


    const handleCheckoutClick = () => {
        setShowCheckout(true);
        modalref.current?.showModal();
    }

    const handleCloseModal = () => {
        setShowCheckout(false);
        modalref.current?.close();
    }

    return (
        <div id="checkout" className='max-w-full'>
            <button
                className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2 hover:bg-green-800"
                onClick={handleCheckoutClick}
            >
                Proceed to Secure Checkout
            </button>
            <dialog ref={modalref}>
                <div>
                    <div>
                        {showCheckout && (
                            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        )}

                    </div>
                    <div>
                        <form method='dialog'>
                            <button onClick={handleCloseModal}>
                                Close
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    )
}