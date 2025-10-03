"use client";

import { Event } from "@/app/lib/types";
import { XMarkIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

interface ShareEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export default function ShareEventModal({ isOpen, onClose, event }: ShareEventModalProps) {
    const [copied, setCopied] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !event) return null;

    const eventUrl = `${window.location.origin}/events/${base16ToBase62(event.id)}`;
    const shareText = `Check out this event: ${event.title}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const shareOptions = [
        {
            name: "Instagram",
            url: null, // Instagram doesn't support direct URL sharing
            onClick: () => {
                // Copy link to clipboard for Instagram sharing
                navigator.clipboard.writeText(eventUrl);
                toast.success("Link copied! Open Instagram and paste in your story or bio");
                // Open Instagram app or web
                window.open('https://www.instagram.com/', '_blank');
            },
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
            ),
            bgColor: "from-purple-500 to-pink-500",
            hoverColor: "hover:scale-105",
        },
        {
            name: "Twitter",
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            ),
            bgColor: "from-gray-900 to-black",
            hoverColor: "hover:scale-105",
        },
        {
            name: "Facebook",
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            ),
            bgColor: "from-blue-600 to-blue-700",
            hoverColor: "hover:scale-105",
        },
        {
            name: "LinkedIn",
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
            ),
            bgColor: "from-blue-700 to-blue-800",
            hoverColor: "hover:scale-105",
        },
        {
            name: "WhatsApp",
            url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
            ),
            bgColor: "from-green-500 to-green-600",
            hoverColor: "hover:scale-105",
        },
        {
            name: "Email",
            url: `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`${shareText}\n\n${eventUrl}`)}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
            ),
            bgColor: "from-gray-600 to-gray-700",
            hoverColor: "hover:scale-105",
        },
    ];

    const handleShareClick = (option: typeof shareOptions[0]) => {
        if (option.onClick) {
            option.onClick();
        } else if (option.url) {
            window.open(option.url, '_blank', 'noopener,noreferrer,width=600,height=400');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-xl w-full max-w-[90%] sm:max-w-[70%] md:max-w-md mx-4 p-6 sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with icon and close button */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Share with Friends</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Share this event with your network</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Share link section */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Share your link</label>
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-3">
                        <input
                            type="text"
                            value={eventUrl}
                            readOnly
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                        />
                        <button
                            onClick={copyToClipboard}
                            className={`p-2 rounded-lg transition-all ${
                                copied
                                    ? "bg-green-100 text-green-600"
                                    : "hover:bg-gray-200 text-gray-600"
                            }`}
                            aria-label="Copy link"
                        >
                            {copied ? (
                                <CheckIcon className="h-5 w-5" />
                            ) : (
                                <ClipboardIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Share to section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Share to</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {shareOptions.map((option) => (
                            <button
                                key={option.name}
                                onClick={() => handleShareClick(option)}
                                className="flex flex-col items-center justify-center space-y-2 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                                aria-label={`Share on ${option.name}`}
                            >
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${option.bgColor} text-white shadow-md ${option.hoverColor}`}>
                                    {option.icon}
                                </div>
                                <span className="text-xs text-gray-600">{option.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}