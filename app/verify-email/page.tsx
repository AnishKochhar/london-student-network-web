"use client";

import { useEffect, Suspense } from "react";
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

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");
            if (!token) {
                toast.error("Invalid or missing token.");
                return;
            }

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
                    return;
                }

                toast.success("Email verified!");
                router.push("/");
            } catch (error) {
                console.error("Error validating token:", error);
                toast.error(
                    error.message || "An error occurred during verification.",
                );
            }
        };

        verifyEmail();
    }, [router, searchParams]);

    return <div className="min-h-screen">Verifying your email...</div>; // Loading indicator or message
}
