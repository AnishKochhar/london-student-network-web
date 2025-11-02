"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AuthButton({ onClick }: { onClick?: () => void }) {
    const session = useSession();

    return (
        <>
            {session?.data?.user ? (
                <Link
                    href="/logout"
                    onClick={onClick}
                    className="py-2 px-4 text-xl text-white rounded-xl transition-all duration-300 ease-in-out hover:shadow-inner hover:bg-red-800"
                >
                    Sign Out
                </Link>
            ) : (
                <Link
                    href="/sign"
                    onClick={onClick}
                    className="py-2 px-4 text-xl text-white rounded-xl transition-all duration-300 ease-in-out hover:shadow-inner hover:bg-blue-800"
                >
                    Sign In
                </Link>
            )}
        </>
    );
}
