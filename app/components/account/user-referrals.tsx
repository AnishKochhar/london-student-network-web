"use client";

import { useState, useEffect } from "react";
import { UserGroupIcon, ShareIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import ReferralShareModal from "./referral-share-modal";

interface ReferralStats {
    totalReferrals: number;
    successfulReferrals: number;
    completedRegistrations: number;
}

interface ReferralItem {
    code: string;
    createdAt: string;
    registeredAt: string | null;
    referredUser: {
        name: string;
        email: string;
    } | null;
}

interface ReferralData {
    stats: ReferralStats;
    recentReferrals: ReferralItem[];
}

export default function UserReferrals({ initialReferralData }: { initialReferralData?: ReferralData }) {
    const [referralData, setReferralData] = useState<ReferralData | null>(initialReferralData || null);
    const [loading, setLoading] = useState(!initialReferralData);
    const [error, setError] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only fetch if we don't have initial data
        if (!initialReferralData) {
            fetchReferralStats();
        }
    }, [initialReferralData]);

    const fetchReferralStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/referral/stats');
            const data = await response.json();

            if (data.success) {
                setReferralData(data);
            } else {
                setError('Failed to load referral statistics');
            }
        } catch (error) {
            console.error('Error fetching referral stats:', error);
            setError('Failed to load referral statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={fetchReferralStats}
                    className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!referralData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-400">No referral data available</p>
            </div>
        );
    }

    const { stats, recentReferrals } = referralData;

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalReferrals}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Total Shares</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-white">{stats.completedRegistrations}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Successful Referrals</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-white">
                                {stats.completedRegistrations >= 10 ? '🎁' : `${10 - stats.completedRegistrations}`}
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm truncate">
                                {stats.completedRegistrations >= 10 ? 'Reward Earned!' : 'To Reward'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Progress towards reward */}
            {stats.completedRegistrations < 10 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-3 sm:p-4 border border-blue-500/30"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white text-sm sm:text-base font-medium">Progress to Reward</h4>
                        <span className="text-blue-300 text-xs sm:text-sm">{stats.completedRegistrations}/10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(stats.completedRegistrations / 10) * 100}%` }}
                        />
                    </div>
                    <p className="text-blue-200 text-xs sm:text-sm mt-2">
                        Get {10 - stats.completedRegistrations} more friends to join and earn a £20-£50 Amazon voucher!
                    </p>
                </motion.div>
            )}

            {/* Recent Referrals */}
            {recentReferrals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10"
                >
                    <h4 className="text-white text-sm sm:text-base font-medium mb-3 sm:mb-4">Recent Activity</h4>
                    <div className="space-y-2 sm:space-y-3">
                        {recentReferrals.slice(0, 5).map((referral, index) => (
                            <div
                                key={`${referral.code}-${index}`}
                                className="flex items-center justify-between py-2 px-2 sm:px-3 bg-white/5 rounded-lg gap-2"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        referral.referredUser
                                            ? 'bg-green-500/20'
                                            : 'bg-yellow-500/20'
                                    }`}>
                                        {referral.referredUser ? (
                                            <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                                        ) : (
                                            <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white text-xs sm:text-sm font-medium truncate">
                                            {referral.referredUser ? referral.referredUser.name : referral.code}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            {referral.referredUser ? 'Joined LSN' : 'Link shared'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-gray-400 text-xs">
                                        {formatDate(referral.registeredAt || referral.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Empty State */}
            {recentReferrals.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center py-6 sm:py-8 px-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                    <UserGroupIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
                    <h4 className="text-white text-sm sm:text-base font-medium mb-2">No referrals yet</h4>
                    <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                        Start sharing your referral link to invite friends to LSN!
                    </p>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="text-blue-300 hover:text-blue-200 text-xs transition-colors cursor-pointer"
                    >
                        💡 <span className="underline decoration-dotted underline-offset-2">Click here to get your unique referral link</span>
                    </button>
                </motion.div>
            )}

            {/* Referral Share Modal - Rendered via Portal */}
            {mounted && createPortal(
                <ReferralShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                />,
                document.body
            )}
        </div>
    );
}