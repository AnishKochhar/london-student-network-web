"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Button } from '../components/button';

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleUnsubscribe = async () => {
        if (!email || !token) {
            setStatus('error');
            setMessage('Invalid unsubscribe link. Please check your email and try again.');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, token }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message || 'You have been successfully unsubscribed.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to unsubscribe. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred. Please try again later.');
        }
    };

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                {status === 'idle' && (
                    <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Unsubscribe from Newsletter
                        </h1>
                        <p className="text-gray-600 mb-6">
                            We&apos;re sorry to see you go! Click the button below to unsubscribe from the
                            London Student Network newsletter.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Email: <strong>{email}</strong>
                        </p>
                        <div className="space-y-3">
                            <Button
                                variant="filled"
                                onClick={handleUnsubscribe}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                Unsubscribe
                            </Button>
                            <Button
                                onClick={() => window.close()}
                                variant="outline"
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                )}

                {status === 'loading' && (
                    <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Processing...
                        </h1>
                        <p className="text-gray-600">
                            Please wait while we process your request.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-center">
                            <div className="text-6xl mb-4">✓</div>
                            <h1 className="text-2xl font-bold text-green-600 mb-4">
                                Unsubscribed Successfully
                            </h1>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <p className="text-sm text-gray-500">
                                You can close this window now.
                            </p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-center">
                            <div className="text-6xl mb-4">✗</div>
                            <h1 className="text-2xl font-bold text-red-600 mb-4">
                                Error
                            </h1>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setStatus('idle')}
                                className="w-full"
                            >
                                Try Again
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
            <UnsubscribeContent />
        </Suspense>
    );
}
