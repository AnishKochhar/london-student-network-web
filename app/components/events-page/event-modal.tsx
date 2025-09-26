"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { EventModalProps } from "@/app/lib/types";
import { motion } from "framer-motion";

interface EventModalPropsWithPreview extends EventModalProps {
    isPreview?: boolean;
}
import { createPortal } from "react-dom";
import { formatEventDateTime, EVENT_TAG_TYPES, returnLogo } from "@/app/lib/utils";
import { useRouter } from "next/navigation";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import MarkdownRenderer from "../markdown/markdown-renderer";
import EventRegistrationButton from "./event-registration-button";

export default function EventModal({ event, onClose, isPreview = false, isRegistered: initialIsRegistered = false, onRegistrationChange }: EventModalPropsWithPreview) {
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [isRegistered, setIsRegistered] = useState(initialIsRegistered);

    const jumpToEvent = () =>
        router.push(`/events/${base16ToBase62(event.id)}`);

    // Disable background scroll and handle outside click detection
    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = "hidden";

        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Check registration status when modal opens
    useEffect(() => {
        if (isPreview) return;

        const checkRegistrationStatus = async () => {
            try {
                const response = await fetch("/api/events/registration-status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event_id: event.id,
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    setIsRegistered(result.isRegistered);
                }
            } catch (error) {
                console.error("Error checking registration status:", error);
            }
        };

        checkRegistrationStatus();
    }, [event.id, isPreview]);

    const getTags = (eventType: number) => {
        const tags = [];
        for (const [key, value] of Object.entries(EVENT_TAG_TYPES)) {
            if (eventType & Number(key)) {
                tags.push(value);
            }
        }
        return tags;
    };

    const societyLogo = returnLogo(event.organiser);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
                ref={modalRef}
                className="relative bg-white w-[90vw] h-[80vh] p-8 border-2 border-black overflow-hidden"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    duration: 0.3
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 transition"
                >
                    <Image
                        src="/icons/close.svg"
                        alt="Close"
                        width={12}
                        height={12}
                        className="hover:brightness-75"
                    />
                </button>

                <div className="flex flex-col md:flex-row h-full overflow-y-auto">
                    {/* Event Image  */}
                    <div className="h-full md:w-1/2 mb-6 md:mb-0 md:mr-6 flex flex-col justify-between">
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            width={500}
                            height={320}
                            sizes="(max-width: 768px) 90vw, 45vw"
                            quality={85}
                            priority
                            className="w-[90%] h-64 object-contain"
                        />
                        <div className="flex flex-col">
                            {societyLogo.found && (
                                <Image
                                    src={
                                        societyLogo.src ||
                                        "/images/societies/roar.png"
                                    }
                                    alt="Society Logo"
                                    width={50}
                                    height={50}
                                    className="object-contain mt-4"
                                />
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                                <strong>Hosted by</strong> {event.organiser}
                            </p>
                        </div>
                    </div>

                    {/* Event Details */}
                    <div className="md:w-1/2">
                        <div className="flex flex-col md:flex-row mb-2 md:mb-0 justify-between items-center">
                            <div className="mb-0">
                                {getTags(event.event_type).map((tag, index) => (
                                    <span
                                        key={index}
                                        className={`inline-block px-3 py-1 text-xs text-white ${tag.color} rounded-full mr-2 lowercase`}
                                    >
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                            <button
                                className="flex items-center rounded-lg px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider  hover:text-black transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={jumpToEvent}
                                disabled={isPreview}
                                aria-disabled={isPreview}
                                aria-label={isPreview ? "Go to event - not available in preview mode" : "Go to event"}
                            >
                                Go To Event
                                <ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {event.title}
                        </h2>
                        <p className="text-gray-700 capitalize italic">
                            {formatEventDateTime(event)}
                        </p>
                        <p className="text-sm :text-lg text-gray-700 mt-2">
                            {event.location_building}
                        </p>
                        <p className="text-sm :text-lg text-gray-600">
                            {event.location_area}
                        </p>
                        <p className="text-sm :text-lg text-gray-500">
                            {event.location_address}
                        </p>

                        {event.capacity && !isNaN(Number(event.capacity)) && Number(event.capacity) > 0 && (
                            <p className="text-sm :text-lg text-gray-900 mt-1">
                                Venue capacity: {event.capacity}
                            </p>
                        )}

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-500">
                                About the Event
                            </h3>
                            <hr className="border-t-1 border-gray-300 m-2" />
                            <div className="text-gray-600">
                                <MarkdownRenderer content={event.description} variant="light" />
                            </div>
                        </div>

                        {event.for_externals && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2 text-gray-500">
                                    Information for external students
                                </h3>
                                <hr className="border-t-1 border-gray-300 m-2" />
                                <p className="text-gray-600">
                                    {event.for_externals}
                                </p>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-500">
                                Registration
                            </h3>
                            <hr className="border-t-1 border-gray-300 m-2" />
                            <div className="w-full flex flex-row justify-center">
                                <EventRegistrationButton
                                    event={event}
                                    isRegistered={isRegistered}
                                    onRegistrationChange={() => {
                                        setIsRegistered(!isRegistered);
                                        onRegistrationChange?.();
                                    }}
                                    isPreview={isPreview}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}
