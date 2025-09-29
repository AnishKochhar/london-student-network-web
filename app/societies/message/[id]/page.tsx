"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
// import { Button } from "@/app/components/button";
import { SocietyMessageFormData } from "@/app/lib/types";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, MessageSquare, User, Mail } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SendEmailPage() {
    const [partner, setPartner] = useState({ name: "" });
    const { id } = useParams(); // Use useParams for dynamic routing to get the dynamic id from the URL
    const { data: session, status } = useSession();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<SocietyMessageFormData>({
        mode: "onSubmit",
        defaultValues: {
            subject: "",
            message: "",
        },
    });

    // const router = useRouter();

    async function fetchPartnerName(id: string) {
        try {
            const response = await fetch("/api/societies/get-organiser-name", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch a specific organiser");
            }

            const data = await response.json();

            return data;
        } catch (err) {
            console.error("failed to retrieve organiser name", err);
        }
    }

    useEffect(() => {
        const fetch = async () => {
            const result = await fetchPartnerName(
                id instanceof Array ? id[0] : id,
            );
            setPartner(result);
        };
        fetch();
    }, [id]);

    const onSubmit = async (data: SocietyMessageFormData) => {
        if (!session) {
            if (status !== "loading") {
                toast.error("Please log in to send a message");
                console.error("User not logged in, message not sent");
                return;
            }
        }
        if (!session.user.email) {
            toast.error("Please contact suppport to set email");
            console.error("No email found for user object");
            return;
        }

        const toastId = toast.loading("Sending email...");

        try {
            const response = await fetch("/api/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id,
                    email: session.user.email,
                    subject: data.subject,
                    text: data.message,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Message sent successfully!", { id: toastId });
                reset(); // Clear the form
            } else {
                toast.error(`Error sending email: ${result.error}`, {
                    id: toastId,
                });
            }
        } catch (error) {
            toast.error(`Error during email sending: ${error.message}`, {
                id: toastId,
            });
            console.error("Error during email sending:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="container mx-auto px-4 py-8">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <Link
                        href={`/societies/society/${id}`}
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Society</span>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                            <MessageSquare className="w-10 h-10 text-purple-400" />
                            Contact {partner.name}
                        </h1>
                        <p className="text-gray-300 text-lg max-w-2xl">
                            Send a message directly to {partner.name}. They&apos;ll receive your message via email and can respond to you directly.
                        </p>
                    </motion.div>
                </div>

                {/* Main Content */}
                <motion.div
                    className="max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                        {/* Login prompt */}
                        {!session && status !== "loading" && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                                <p className="text-yellow-300 text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Please log in to send a message to {partner.name}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Subject Field */}
                            <div className="space-y-2">
                                <label className="block text-white font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    placeholder={`Message to ${partner.name}`}
                                    {...register("subject", {
                                        required: "Subject is required",
                                        minLength: { value: 3, message: "Subject must be at least 3 characters" }
                                    })}
                                    className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all outline-none"
                                />
                                {errors.subject && (
                                    <p className="text-red-400 text-sm">{errors.subject.message}</p>
                                )}
                            </div>

                            {/* Message Field */}
                            <div className="space-y-2">
                                <label className="block text-white font-medium flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Message
                                </label>
                                <textarea
                                    rows={8}
                                    placeholder="Enter your message here..."
                                    {...register("message", {
                                        required: "Message is required",
                                        minLength: { value: 10, message: "Message must be at least 10 characters" }
                                    })}
                                    className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all outline-none resize-vertical"
                                />
                                {errors.message && (
                                    <p className="text-red-400 text-sm">{errors.message.message}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={!session || status === "loading"}
                                    className="group inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    <span>Send Message</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    className="max-w-2xl mx-auto mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">💡 Tips for a great message</h3>
                        <ul className="text-gray-300 space-y-2 text-sm">
                            <li>• Be specific about what you&apos;re interested in</li>
                            <li>• Mention if you&apos;re looking to join events or get involved</li>
                            <li>• Include any relevant experience or background</li>
                            <li>• Be polite and professional</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
