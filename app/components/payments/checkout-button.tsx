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
        <div id="checkout" className="max-w-full px-4">
            {/* Checkout Button */}
            <button
                className="btn btn-primary w-full text-sm font-light mt-2 hover:bg-purple-800"
                onClick={handleCheckoutClick}
            >
                Proceed to Secure Checkout
            </button>

            {/* Modal */}
            <dialog ref={modalref} className="modal">
                <div className="modal-box">
                    <h2 className="text-2xl font-bold text-center mb-4">Secure Checkout</h2>

                    {/* Embedded Checkout Component */}
                    {showCheckout && (
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    )}

                    <div className="modal-action">
                        <button className="btn" onClick={handleCloseModal}>Close</button>
                    </div>
                </div>
            </dialog>
        </div>
    )
}