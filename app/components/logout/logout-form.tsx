"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function LogoutForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const router = useRouter();

    const handleLogout = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            signOut({ callbackUrl: "/login" });
        } catch (error) {
            console.error("Logout failed:", error);
            setErrorMessage("Failed to log out. Please try again.");
            setIsLoading(false);
        }
    };

    const returnHome = () => {
        router.push("/");
    };

    return (
        <>
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-white mb-3">
                    Log Out
                </h1>
                <p className="text-white/90 text-lg mb-8">
                    Are you sure you want to log out?
                </p>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-400/20 backdrop-blur-sm border border-red-300/30 rounded-xl">
                        <p className="text-red-200 text-sm">{errorMessage}</p>
                    </div>
                )}

            </div>

            <div className="space-y-4 mt-2">
                <button
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-white transition-all shadow-lg"
                    onClick={returnHome}
                    disabled={isLoading}
                >
                    Go Back
                </button>

                <button
                    className="w-full px-6 py-4 bg-red-700/90 text-gray-900 rounded-xl font-semibold hover:bg-red-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                    onClick={handleLogout}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center space-x-2">
                            <svg
                                className="animate-spin h-5 w-5 text-gray-900"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8V12H4z"
                                ></path>
                            </svg>
                            <span>Logging Out...</span>
                        </span>
                    ) : (
                        "Log Out"
                    )}
                </button>
            </div>
        </>
    );
}
