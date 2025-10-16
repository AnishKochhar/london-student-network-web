"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Suspense will be used for handling client-side rendering
export default function VerifyEmailTemporaryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
            <VerifyEmailPage />
        </Suspense>
    );
}

function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'logging-in' | 'error'>('verifying');
    const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);

    useEffect(() => {
        // Prevent duplicate verification attempts
        if (hasAttemptedVerification) return;

        const verifyEmail = async () => {
            const token = searchParams.get("token");
            if (!token) {
                toast.error("Invalid or missing token.");
                setVerificationStatus('error');
                setTimeout(() => router.push("/login"), 3000);
                return;
            }

            // Mark that we've attempted verification
            setHasAttemptedVerification(true);

            try {
                const response = await fetch("/api/email/verify-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    toast.error(
                        "An error occurred during verification, or the link is expired.",
                    );
                    setVerificationStatus('error');
                    setTimeout(() => router.push("/login"), 3000);
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    toast.success("Email verified! Logging you in...");
                    setVerificationStatus('logging-in');

                    // Store a flag to show welcome message after login
                    sessionStorage.setItem('justVerified', 'true');
                    sessionStorage.setItem('verifiedEmail', data.email);

                    // Redirect to login page with verified email pre-filled
                    // The user will need to enter their password for security
                    setTimeout(() => {
                        router.push(`/login?verified=true&email=${encodeURIComponent(data.email)}`);
                    }, 1500);
                }
            } catch (error) {
                console.error("Error validating token:", error);
                toast.error(
                    error.message || "An error occurred during verification.",
                );
                setVerificationStatus('error');
                setTimeout(() => router.push("/login"), 3000);
            }
        };

        verifyEmail();
    }, [router, searchParams, hasAttemptedVerification]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center">
            <div className="text-center text-white max-w-md mx-auto px-4">
                {verificationStatus === 'verifying' && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
                        <p className="text-gray-300">Please wait while we confirm your email address</p>
                    </div>
                )}

                {verificationStatus === 'logging-in' && (
                    <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8">
                        <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
                        <p className="text-gray-300">Redirecting you to login...</p>
                    </div>
                )}

                {verificationStatus === 'error' && (
                    <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8">
                        <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                        <p className="text-gray-300">Redirecting to login page...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
