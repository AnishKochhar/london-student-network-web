"use client";

import { Button } from "../../components/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateEventButton() {
    const router = useRouter();

    const session = useSession();

    const handleCreateEvent = async () => {
        if (session) {
            router.push("/events/create");
        } else {
            router.push("/login");
        }
    };

    return (
        <div className="self-center mb-12 md:mb-2 md:self-end">
            <Button
                variant="ghost"
                size="lg"
                className="text-xl  text-white hover:bg-slate-800"
                onClick={handleCreateEvent}
            >
                <PlusIcon width={18} height={18} className="mr-2" />
                Create An Event
            </Button>
            <hr className="border-t-1 border-gray-300" />
        </div>
    );
}
