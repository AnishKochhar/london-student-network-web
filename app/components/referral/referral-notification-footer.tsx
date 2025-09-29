"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserGroupIcon } from "@heroicons/react/24/outline";

interface ReferralData {
    code: string;
    referrer: {
        id: string;
        name: string;
        email: string;
    };
}

export default function ReferralNotificationFooter() {
    const [referralData, setReferralData] = useState<ReferralData | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check for referral data in sessionStorage
        const stored = sessionStorage.getItem('referralData');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setReferralData(data);
                setIsVisible(true);
            } catch (error) {
                console.error('Error parsing referral data:', error);
            }
        }
    }, []);

    if (!referralData || !isVisible) {
        return null;
    }

    return (
        <AnimatePresence>
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
                className="fixed bottom-0 left-0 right-0 z-50"
            >
                {/* Background with green theme for referral */}
                <div className="bg-green-800/90 backdrop-blur-sm border-t border-green-600/50">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-600/50 rounded-full flex items-center justify-center">
                                    <UserGroupIcon className="w-4 h-4 text-green-200" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-center">
                                <p className="text-green-100 text-sm font-medium">
                                    🎉 Referral from{' '}
                                    <span className="text-white font-semibold">
                                        {referralData.referrer.name}
                                    </span>
                                </p>
                                <p className="text-green-200 text-xs mt-0.5">
                                    Complete your registration to connect with your referrer
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}