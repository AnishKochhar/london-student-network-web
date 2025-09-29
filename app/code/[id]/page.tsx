"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface ReferrerData {
    id: string;
    name: string;
    email: string;
}

export default function ReferralCodePage() {
    const { id: referralCode } = useParams();
    const router = useRouter();
    const { status } = useSession();
    const [referrer, setReferrer] = useState<ReferrerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReferrer = useCallback(async () => {
        if (!referralCode) return;

        try {
            const response = await fetch('/api/referral/get-referrer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ referralCode }),
            });

            const data = await response.json();

            if (data.success) {
                setReferrer(data.referrer);
                // Store referral info in sessionStorage for the registration process
                sessionStorage.setItem('referralData', JSON.stringify({
                    code: referralCode,
                    referrer: data.referrer
                }));

                // Redirect to register page after a brief delay
                setTimeout(() => {
                    router.push('/register');
                }, 2000);
            } else {
                setError('Invalid referral code');
                setTimeout(() => {
                    router.push('/register');
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching referrer:', error);
            setError('Something went wrong');
            setTimeout(() => {
                router.push('/register');
            }, 3000);
        } finally {
            setLoading(false);
        }
    }, [referralCode, router]);

    useEffect(() => {
        // If user is already logged in, redirect them away
        if (status === "authenticated") {
            router.push("/events");
            return;
        }

        if (status === "loading") return;

        // Fetch referrer information
        fetchReferrer();
    }, [referralCode, status, router, fetchReferrer]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Processing your referral...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center">
                <div className="text-center text-white max-w-md mx-auto px-4">
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
                        <h1 className="text-xl font-bold mb-2">Invalid Referral Code</h1>
                        <p className="text-red-200">{error}</p>
                    </div>
                    <p className="text-gray-300">
                        Redirecting you to registration...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center">
            <div className="text-center text-white max-w-md mx-auto px-4">
                {referrer && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold mb-2">
                            You&apos;ve been invited!
                        </h1>

                        <p className="text-gray-300 mb-4">
                            <span className="font-semibold text-white">{referrer.name}</span> has invited you to join the London Student Network
                        </p>

                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-blue-200 text-sm">
                                🎁 Join now to unlock exclusive student events, networking opportunities, and more!
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 text-gray-300">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p>Taking you to registration...</p>
                </div>
            </div>
        </div>
    );
}