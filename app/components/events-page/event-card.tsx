"use client";

import Image from "next/image";
import { useState } from "react";
import { EventCardProps } from "@/app/lib/types";
import { formatDateString } from "@/app/lib/utils";
import EventCardTags from "./event-tags";
import EventModal from "./event-modal";
import EditPage from "../edit/edit";

export default function EventCard({ event, editEvent }: EventCardProps) {
    const [modalChoice, setModalChoice] = useState<"edit" | "view" | "waiting">(
        "waiting",
    );

    const openEditModal = () => setModalChoice("edit");
    const openViewModal = () => setModalChoice("view");
    const closeModal = () => setModalChoice("waiting");

    const handleCardClick = () => {
        {
            editEvent ? openEditModal() : openViewModal();
        } // !editEvent is the most likely scenario
    };

    if (modalChoice === "view") {
        return <EventModal event={event} onClose={closeModal} />;
    }

    if (modalChoice === "edit") {
        return <EditPage event={event} onClose={closeModal} />;
    }

    return (
        <>
            <div
                className="flex flex-col p-4 rounded-lg shadow-lg relative cursor-pointer overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group"
                onClick={handleCardClick}
            >
                <EventCardTags eventType={event.event_type} />
                <div className="relative overflow-hidden rounded-md mb-1">
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        width={400}
                        height={160}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={90}
                        className={`w-full h-40 ${event.image_contain ? "object-contain" : "object-cover"} border border-gray-200 transition-transform duration-500 group-hover:scale-110`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex flex-col justify-between flex-grow">
                    <div>
                        <p className="text-gray-600 text-sm uppercase tracking-wide">
                            {formatDateString(event.date)} | {event.time}
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
            </div>
        </>
    );
}
