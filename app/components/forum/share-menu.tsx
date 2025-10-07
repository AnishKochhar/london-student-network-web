"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    ShareIcon,
    LinkIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface ShareMenuProps {
    url: string;
    title: string;
    compact?: boolean;
}

export default function ShareMenu({ url, title, compact = false }: ShareMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Handle mounting for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update menu position when opened
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuWidth = 192; // 192px = w-48 (12rem)

            // Calculate position, ensuring menu stays on screen
            let left = rect.right - menuWidth;
            const top = rect.bottom + 8;

            // Prevent menu from going off left edge
            if (left < 8) {
                left = 8;
            }

            // Prevent menu from going off right edge
            if (left + menuWidth > window.innerWidth - 8) {
                left = window.innerWidth - menuWidth - 8;
            }

            setMenuPosition({ top, left });
        }
    }, [isOpen]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);
            const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);

            if (isOutsideMenu && isOutsideButton) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleCopyLink = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const handleShare = (platform: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);

        const shareUrls: Record<string, string> = {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            email: `mailto:?subject=${encodedTitle}&body=Check%20this%20out:%20${encodedUrl}`,
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
        }
        setIsOpen(false);
    };

    // Render menu content
    const menuContent = (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed w-48 bg-[#041A2E] border border-white/20 rounded-lg shadow-xl overflow-hidden"
            style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 99999,
                pointerEvents: 'auto',
            }}
            data-share-menu="true"
        >
                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                        >
                            {copied ? (
                                <CheckIcon className="w-5 h-5 text-green-400" />
                            ) : (
                                <LinkIcon className="w-5 h-5 text-white/70" />
                            )}
                            <span className="text-sm text-white/90">
                                {copied ? "Copied!" : "Copy Link"}
                            </span>
                        </button>

                        {/* Twitter/X */}
                        <button
                            onClick={handleShare("twitter")}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span className="text-sm text-white/90">Share on X</span>
                        </button>

                        {/* LinkedIn */}
                        <button
                            onClick={handleShare("linkedin")}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <span className="text-sm text-white/90">Share on LinkedIn</span>
                        </button>

                        {/* WhatsApp */}
                        <button
                            onClick={handleShare("whatsapp")}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span className="text-sm text-white/90">Share on WhatsApp</span>
                        </button>

                        {/* Email */}
                        <button
                            onClick={handleShare("email")}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-t border-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-white/90">Share via Email</span>
                        </button>
                    </motion.div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-2 ${
                    compact
                        ? "px-2 py-1"
                        : "px-3 py-1"
                } rounded hover:bg-white/5 transition-colors ${
                    isOpen ? "bg-white/5" : ""
                }`}
                title="Share"
            >
                <ShareIcon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                {!compact && <span>Share</span>}
            </button>

            {mounted && isOpen && createPortal(
                menuContent,
                document.body
            )}
        </>
    );
}
