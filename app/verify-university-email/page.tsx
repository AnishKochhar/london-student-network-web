"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function VerifyUniversityEmail() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { update } = useSession();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);

    useEffect(() => {
        // Prevent duplicate verification attempts
        if (hasAttemptedVerification) return;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link");
            return;
        }

        const verifyEmail = async () => {
            // Mark that we've attempted verification
            setHasAttemptedVerification(true);

            try {
                const response = await fetch("/api/email/verify-university-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const result = await response.json();

                if (result.success) {
                    setStatus("success");
                    setMessage("Your university email has been verified successfully!");

                    // Update the session to refresh verified_university in JWT
                    await update();
                } else {
                    setStatus("error");
                    setMessage(result.error || "Verification failed. The link may have expired.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("An error occurred during verification. Please try again.");
            }
        };

        verifyEmail();
    }, [searchParams, hasAttemptedVerification, update]);

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
                {status === "loading" && (
                    <>
                        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-white mb-3">
                            Verifying your university email...
                        </h1>
                        <p className="text-gray-300">Please wait a moment</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">
                            Verification Successful!
                        </h1>
                        <p className="text-gray-300 mb-6">{message}</p>
                        <p className="text-gray-400 text-sm mb-6">
                            You can now access university-exclusive events and features.
                        </p>
                        <Link
                            href="/account"
                            className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-white/90 transition-all"
                        >
                            Go to My Account
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">
                            Verification Failed
                        </h1>
                        <p className="text-gray-300 mb-6">{message}</p>
                        <div className="space-y-3">
                            <Link
                                href="/account"
                                className="block w-full px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-white/90 transition-all"
                            >
                                Go to My Account
                            </Link>
                            <p className="text-gray-400 text-sm">
                                You can request a new verification email from your account page.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
