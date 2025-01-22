'use client'


import getStripe from '@/app/lib/stripe_config';
const stripePromise = getStripe();
import { useEffect } from 'react';


export default function CheckoutPage() {
    useEffect(() => {
        const setPrice = async () => {
            try {
                const response = await fetch('/api/payments/create-priceId', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ subcurrencyAmount:150, productName: 'test_case_1' }),
                })
                console.log('start');
                console.log(response);

                const res = await response.json()

                console.log(res.priceId);
            } catch(error) {
                console.log(error);
            }
        }

        setPrice();
    }, [])
    return (
        <main>
            <p>Invoking Route</p>
        </main>
    );
}