"use client";

import LogoutForm from "../components/logout/logout-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
    const router = useRouter();
    const session = useSession();

    if (!session) {
        router.push("/login");
    }

    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#083157] to-[#064580]">
            <div className="mx-auto flex w-full max-w-[500px] flex-col p-4">
                <LogoutForm />
            </div>
        </main>
    );
}
