'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DonationDetails {
    amount: number;
    fee_covered: number;
    society_name: string;
    donor_email: string;
}

export default function DonationSuccessPage() {
    const { slug } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');

    const [loading, setLoading] = useState(true);
    const [donation, setDonation] = useState<DonationDetails | null>(null);
    const [_error, setError] = useState<string | null>(null);

    const stringSlug = slug instanceof Array ? slug[0] : slug;

    useEffect(() => {
        const verifyDonation = async () => {
            if (!sessionId) {
                setError('No session ID provided');
                setLoading(false);
                return;
            }

            try {
                // Fetch donation details from the session
                const response = await fetch(`/api/society/donate/verify?session_id=${sessionId}`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.donation) {
                        setDonation(data.donation);
                    } else {
                        // Even if we can't verify, show success (webhook might not have processed yet)
                        setDonation(null);
                    }
                } else {
                    // Show generic success even if verification fails
                    setDonation(null);
                }
            } catch (err) {
                console.error('Error verifying donation:', err);
                // Still show success page even if verification fails
                setDonation(null);
            } finally {
                setLoading(false);
            }
        };

        verifyDonation();
    }, [sessionId]);

    // If no session ID, redirect to society page
    useEffect(() => {
        if (!sessionId && !loading) {
            router.push(`/societies/${stringSlug}`);
        }
    }, [sessionId, loading, router, stringSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Confirming your donation...</p>
                </div>
            </div>
        );
    }

    const amountInPounds = donation ? (donation.amount / 100).toFixed(2) : null;
    const feeCoveredInPounds = donation && donation.fee_covered > 0
        ? (donation.fee_covered / 100).toFixed(2)
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <CheckCircle className="w-12 h-12 text-pink-500" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Thank You!
                    </h1>
                    <p className="text-pink-100">
                        Your donation has been received
                    </p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {donation && amountInPounds ? (
                        <>
                            <div className="text-center mb-6">
                                <p className="text-gray-600 mb-2">You donated</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    £{amountInPounds}
                                </p>
                                {feeCoveredInPounds && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        + £{feeCoveredInPounds} to cover fees
                                    </p>
                                )}
                                <p className="text-gray-600 mt-2">
                                    to <span className="font-semibold text-pink-600">{donation.society_name}</span>
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Heart className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800">
                                            100% goes to the society
                                        </p>
                                        <p className="text-xs text-green-600 mt-0.5">
                                            We don&apos;t take any platform fees on donations
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-600">
                                    A confirmation email has been sent to:
                                </p>
                                <p className="text-sm font-medium text-gray-900 mt-1">
                                    {donation.donor_email}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center mb-6">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-center gap-2">
                                    <Heart className="w-5 h-5 text-green-600" />
                                    <p className="text-sm font-medium text-green-800">
                                        Your donation is being processed
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-600">
                                You&apos;ll receive a confirmation email shortly with the details of your donation.
                            </p>
                        </div>
                    )}

                    <Link
                        href={`/societies/${stringSlug}`}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Society Page
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
