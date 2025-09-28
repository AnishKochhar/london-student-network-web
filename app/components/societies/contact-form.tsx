"use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SocietyMessageFormData } from "@/app/lib/types";
import { Send, User, Mail, MessageSquare } from "lucide-react";

interface ContactFormProps {
    societyName: string;
    societyId: string;
}

export default function ContactForm({ societyName, societyId }: ContactFormProps) {
    const { data: session, status } = useSession();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<SocietyMessageFormData>({
        mode: "onSubmit",
        defaultValues: {
            subject: "",
            message: "",
        },
    });

    // const router = useRouter();

    const onSubmit = async (data: SocietyMessageFormData) => {
        if (!session) {
            if (status !== "loading") {
                toast.error("Please log in to send a message");
                console.error("User not logged in, message not sent");
                return;
            }
        }
        if (!session?.user?.email) {
            toast.error("Please contact support to set email");
            console.error("No email found for user object");
            return;
        }

        const toastId = toast.loading("Sending message...");

        try {
            const response = await fetch("/api/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: societyId,
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
                toast.error(`Error sending message: ${result.error}`, {
                    id: toastId,
                });
            }
        } catch (error) {
            toast.error(`Error during message sending: ${error.message}`, {
                id: toastId,
            });
            console.error("Error during message sending:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Login prompt */}
            {!session && status !== "loading" && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-300 text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Please log in to send a message to {societyName}
                    </p>
                </div>
            )}

            {/* Subject Field */}
            <div className="space-y-2">
                <label className="block text-white font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Subject
                </label>
                <input
                    type="text"
                    placeholder={`Message to ${societyName}`}
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
                    rows={6}
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
            <div className="flex justify-end">
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
    );
}