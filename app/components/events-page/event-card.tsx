"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EventCardProps } from "@/app/lib/types";
import { formatEventDateTime } from "@/app/lib/utils";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import EventCardTags from "./event-tags";
import EventModal from "./event-modal";
import { EyeSlashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function EventCard({ event, editEvent }: EventCardProps) {
    const [modalChoice, setModalChoice] = useState<"edit" | "view" | "manage" | "waiting">(
        "waiting",
    );

    const openViewModal = () => setModalChoice("view");
    const closeModal = () => setModalChoice("waiting");

    const handleCardClick = (e: React.MouseEvent) => {
        if (editEvent) {
            // Show loading toast for manage navigation
            toast.loading("Opening event management...", { id: "manage-navigation" });
            // Link will handle the navigation with prefetching
        } else {
            // Prevent link navigation for view modal
            e.preventDefault();
            openViewModal();
        }
    };

    // Generate the href for edit mode (manage page)
    const manageHref = editEvent ? `/events/${base16ToBase62(event.id)}/manage` : undefined;

    // Card content component to avoid duplication
    const cardContent = (
        <>
            <EventCardTags eventType={event.event_type} />
            {event.is_hidden && editEvent && (
                <div className="absolute top-2 left-2 z-10 bg-red-100 border border-red-300 rounded-full p-1.5 shadow-sm">
                    <EyeSlashIcon className="h-4 w-4 text-red-600" />
                </div>
            )}
            <div className="relative overflow-hidden rounded-md mb-1">
                <Image
                    src={event.image_url}
                    alt={event.title}
                    width={400}
                    height={160}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    quality={60}
                    loading="lazy"
                    className={`w-full h-40 ${event.image_contain ? "object-contain" : "object-cover"} border border-gray-200 transition-transform duration-500 group-hover:scale-110`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col justify-between flex-grow">
                <div>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                        {formatEventDateTime(event)}
                    </p>
                    <h3 className="text-slate-700 text-xl font-bold mt-2 mb-2 line-clamp-3 group-hover:text-blue-600 transition-colors duration-200">
                        {event.title}
                    </h3>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">
                        {event.location_area}
                    </p>
                    <p className="text-black text-right mt-2 truncate text-ellipsis font-medium">
                        {event.organiser}
                    </p>
                </div>
            </div>
        </>
    );

    return (
        <>
            {editEvent && manageHref ? (
                // For edit mode: use Link with prefetch for instant navigation
                <Link
                    href={manageHref}
                    prefetch={true}
                    className="flex flex-col p-4 rounded-lg shadow-lg relative cursor-pointer overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group"
                    onClick={handleCardClick}
                >
                    {cardContent}
                </Link>
            ) : (
                // For view mode: regular div with modal
                <div
                    className="flex flex-col p-4 rounded-lg shadow-lg relative cursor-pointer overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group"
                    onClick={handleCardClick}
                >
                    {cardContent}
                </div>
            )}

            {/* Render modals conditionally */}
            {modalChoice === "view" && (
                <EventModal event={event} onClose={closeModal} />
            )}
        </>
    );
}
