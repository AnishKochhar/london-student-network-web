"use client";

import { useState, useEffect, useCallback } from "react";
import { ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import ReferralShareModal from "./referral-share-modal";

export default function ShareFooter() {
    const [isVisible, setIsVisible] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);

    // Auto-show the footer after a delay when component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 2000); // Show after 2 seconds

        return () => clearTimeout(timer);
    }, []);

    // Calculate bottom offset when site footer is visible
    const calculateBottomOffset = useCallback(() => {
        // Find the site footer element
        const siteFooter = document.querySelector('footer');
        if (!siteFooter) {
            setBottomOffset(0);
            return;
        }

        const footerRect = siteFooter.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // If any part of the footer is visible in the viewport
        if (footerRect.top < windowHeight && footerRect.bottom > 0) {
            // Calculate how much space we need above the footer
            const visibleFooterHeight = Math.min(windowHeight - footerRect.top, footerRect.height);
            setBottomOffset(visibleFooterHeight + 16); // 16px gap
        } else {
            // Footer not visible, stick to bottom of viewport
            setBottomOffset(0);
        }
    }, []);

    // Set up scroll listener
    useEffect(() => {
        if (!isVisible) return;

        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    calculateBottomOffset();
                    ticking = false;
                });
                ticking = true;
            }
        };

        const handleResize = () => {
            calculateBottomOffset();
        };

        // Initial calculation
        calculateBottomOffset();

        // Add listeners
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        // Cleanup
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [isVisible, calculateBottomOffset]);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                        duration: 0.5
                    }}
                    className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
                    style={{
                        transform: `translateY(-${bottomOffset}px)`
                    }}
                >
                    {/* Background with dark blue and 80% alpha */}
                    <div className="bg-blue-900/80 backdrop-blur-sm border-t border-blue-700/50">
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                {/* Share content */}
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-600/50 rounded-full flex items-center justify-center">
                                            <ShareIcon className="w-5 h-5 text-blue-200" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium text-sm md:text-base">
                                            Share the gift of LSN
                                        </h3>
                                        <p className="text-blue-200 text-xs md:text-sm mt-1 line-clamp-2">
                                            Share with 10 friends to get them to make an account and earn the chance to a £20-£50 gift voucher for Amazon
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-3 ml-4">
                                    <button
                                        onClick={handleShare}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <ShareIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Share Now</span>
                                        <span className="sm:hidden">Share</span>
                                    </button>

                                    <button
                                        onClick={handleDismiss}
                                        className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-blue-800/50 transition-colors duration-200"
                                        aria-label="Dismiss"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Referral Share Modal */}
            <ReferralShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />
        </AnimatePresence>
    );
}