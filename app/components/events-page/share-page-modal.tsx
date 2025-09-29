"use client";

import { XMarkIcon, LinkIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import toast from "react-hot-toast";

interface SharePageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageTitle: string;
    pageDescription: string;
    pageUrl?: string;
}

export default function SharePageModal({ isOpen, onClose, pageTitle, pageDescription, pageUrl }: SharePageModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const currentUrl = pageUrl || window.location.href;
    const shareText = `Check out ${pageTitle}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const shareOptions = [
        {
            name: "Twitter",
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
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
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
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
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
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
            url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`,
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
            url: `mailto:?subject=${encodeURIComponent(pageTitle)}&body=${encodeURIComponent(`${shareText}\n\n${pageDescription}\n\n${currentUrl}`)}`,
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

    const handleShareClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z"/>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold">Share Page</h3>
                        <p className="text-white/80 text-sm mt-1">Spread the word about London Student Network</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Page Info */}
                    <div className="text-center mb-6">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{pageTitle}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2">{pageDescription}</p>
                    </div>

                    {/* Copy Link Section */}
                    <div className="mb-6">
                        <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-3 border">
                            <LinkIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <input
                                type="text"
                                value={currentUrl}
                                readOnly
                                className="flex-1 bg-transparent text-xs text-gray-700 outline-none truncate"
                            />
                            <button
                                onClick={copyToClipboard}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    copied
                                        ? "bg-green-100 text-green-700"
                                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                }`}
                            >
                                {copied ? (
                                    <CheckIcon className="h-3 w-3" />
                                ) : (
                                    <ClipboardIcon className="h-3 w-3" />
                                )}
                                <span>{copied ? "Copied!" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Share Options */}
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-gray-500 text-center mb-4">Share on social media</p>
                        <div className="grid grid-cols-2 gap-3">
                            {shareOptions.map((option) => (
                                <button
                                    key={option.name}
                                    onClick={() => handleShareClick(option.url)}
                                    className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r ${option.bgColor} ${option.hoverColor} transform active:scale-95 shadow-md hover:shadow-lg`}
                                >
                                    {option.icon}
                                    <span className="text-sm">{option.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}