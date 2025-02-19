'use client'


import { useEffect, useState } from 'react';
import { getCurrentPublicStripeConnectPromise } from '@/app/lib/singletons-public';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';
import { StripeConnectInstance } from '@stripe/connect-js';

export default function ResumeEmbeddedStripeConnectOnboardingForm({userId} : {userId: string}) {
    const [error, setError] = useState<string | null>(null);
    const [stripeConnectInstance, setStripeConnectInstance] = useState<StripeConnectInstance | null>(null);

    useEffect(() => {
        const initializeStripeConnect = async () => {
            try {
                const { instance } = await getCurrentPublicStripeConnectPromise(userId);
                setStripeConnectInstance(instance);
            } catch (error) {
                console.error('Error fetching Stripe Connect instance:', error);
                setError('Failed to fetch Stripe Connect instance.');
            }
        };

        initializeStripeConnect();
    }, []);


    const handleOnExit = async () => {
        // can be modified to show popup modal
        return;
    };


    return (
        <div className="w-full mx-auto p-6 bg-transparent rounded-lg text-white">
            {/* Notice */}
            <div className="text-center mb-6">
                <p className="text-sm text-white">
                    If you want to charge for tickets, register for Stripe Connect by following the steps below. 
                    <br />
                    <span className="text-white opacity-70">You can always complete this process later by editing your account profile.</span>
                </p>
            </div>

            {/* Stripe Connect Onboarding Form */}
            {error && <p className="text-red-600 text-center mb-4">{error}</p>}
            {stripeConnectInstance ? (
                <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                    <ConnectAccountOnboarding
                        onExit={handleOnExit}
                    />
                </ConnectComponentsProvider>
            ) : (
                <div className="text-center">
                    <button className="btn loading btn-primary w-full text-white">Loading...</button>
                </div>
            )}
        </div>
    );
}
