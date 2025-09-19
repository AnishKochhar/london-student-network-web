"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Event, EventModalProps } from "@/app/lib/types";
import EditEventComponent from "@/app/components/events-page/edit-event";

export default function EditPageComponent({ event, onClose }: EventModalProps) {
    const [status, setStatus] = useState<
        "loading" | "valid" | "unauthorized" | "forbidden"
    >("loading");
    const [eventProp] = useState<Event>(event);

    const session = useSession();

    useEffect(() => {
        async function validateEditPrivileges(targetEvent: Event) {
            // Soft verification for UX. There is a second, hard check in backend for security
            try {
                setStatus("loading"); // in case session changes

                const response = await fetch(
                    "/api/protected/events/verify-owner-of-event",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ eventId: targetEvent.id }),
                    },
                );

                // const data = await response.json();

                switch (response.status) {
                    case 200:
                        setStatus("valid");
                        break;
                    case 401:
                        setStatus("unauthorized");
                        break;
                    case 403:
                        setStatus("forbidden");
                        break;
                    default:
                        setStatus("unauthorized");
                        break;
                }
            } catch (error) {
                setStatus("unauthorized");
                console.error("Error verifying ownership:", error);
            }
        }

        validateEditPrivileges(eventProp);
    }, [session, eventProp]);

    // could use better + more informative screens

    if (status === "forbidden") return <ForbiddenScreen />;

    if (status === "unauthorized") return <UnauthorizedScreen />;

    if (status === "loading") return <LoadingScreen />;

    return <EditEventComponent eventProp={eventProp} onClose={onClose} />;
}

function LoadingScreen() {
    // loading
    return (
        <main className="min-h-screen w-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-3xl">Loading...</h1>
            </div>
        </main>
    );
}

function UnauthorizedScreen() {
    // not logged in
    return (
        <main className="min-h-screen w-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-3xl">
                    You must be authorized to access this resource.
                </h1>
            </div>
        </main>
    );
}

function ForbiddenScreen() {
    // don't have permission to edit
    return (
        <main className="min-h-screen w-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-3xl">
                    Access denied. You do not have permission to access this
                    resource.
                </h1>
            </div>
        </main>
    );
}
