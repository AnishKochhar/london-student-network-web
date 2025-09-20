"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, UserIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { LiquidButton } from "../components/ui/liquid-button";

export default function SignPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#041A2E] via-[#064580] to-[#083157] text-white relative overflow-hidden">
            {/* Background particles/decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-cyan-400/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-6xl">
                    {/* Animated Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                            Welcome to LSN
                        </h1>
                        <motion.div
                            className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "250px" }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        />
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            className="text-xl text-gray-300 mt-6"
                        >
                            Choose your path to connect with London&apos;s student community
                        </motion.p>
                    </motion.div>

                    {/* Main Content */}
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24">
                        {/* Left Section - Sign In */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col items-center text-center max-w-sm"
                        >
                            <motion.div
                                className="mb-8 p-6 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <UserIcon className="w-12 h-12 text-blue-300" />
                            </motion.div>

                            <h2 className="text-3xl font-bold mb-4 text-white">
                                Already got an account?
                            </h2>
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                Welcome back! Sign in to access your dashboard and connect with your community.
                            </p>

                            <Link href="/login">
                                <LiquidButton size="lg" className="group">
                                    <UserIcon className="w-5 h-5" />
                                    <span className="font-semibold">Sign In</span>
                                    <motion.div
                                        animate={{ x: 0 }}
                                        whileHover={{ x: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </motion.div>
                                </LiquidButton>
                            </Link>
                        </motion.div>

                        {/* Animated Divider */}
                        <motion.div
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="hidden lg:block w-px h-96 bg-gradient-to-b from-transparent via-white/30 to-transparent"
                        />

                        {/* Mobile divider */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="lg:hidden w-64 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />

                        {/* Right Section - Create Account */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-col items-center text-center max-w-sm"
                        >
                            <motion.div
                                className="mb-8 p-6 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <UserPlusIcon className="w-12 h-12 text-purple-300" />
                            </motion.div>

                            <h2 className="text-3xl font-bold mb-4 text-white">
                                New to LSN?
                            </h2>
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                Join thousands of students across London. Create your account and start networking today.
                            </p>

                            <Link href="/register">
                                <LiquidButton size="lg" variant="primary" className="group">
                                    <UserPlusIcon className="w-5 h-5" />
                                    <span className="font-semibold">Create Account</span>
                                    <motion.div
                                        animate={{ x: 0 }}
                                        whileHover={{ x: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </motion.div>
                                </LiquidButton>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                        className="text-center mt-20"
                    >
                        <p className="text-gray-400 text-sm">
                            Questions? Need help? <Link href="/contact" className="text-blue-300 hover:text-blue-200 underline transition-colors">Contact us</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
