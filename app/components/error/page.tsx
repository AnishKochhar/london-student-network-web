import React from "react";
import Link from "next/link";

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center px-6">
            <h1 className="text-9xl font-bold text-red-500">404</h1>
            <p className="mt-4 text-lg text-gray-400">
                Oops, resource not found
            </p>
            <Link href="/" passHref>
                <button className="mt-6 px-6 py-2 text-lg font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2">
                    Go Home
                </button>
            </Link>
        </div>
    );
}
