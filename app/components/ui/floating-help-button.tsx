"use client";

import { useState } from "react";
import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface FeedbackForm {
    name: string;
    email?: string;
    message: string;
}

export default function FloatingHelpButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FeedbackForm>();

    const onSubmit = async (data: FeedbackForm) => {
        setIsSubmitting(true);
        const toastId = toast.loading("Sending feedback...");

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Thank you for your feedback! We'll get back to you soon.", {
                    id: toastId,
                    duration: 5000,
                });
                reset();
                setIsModalOpen(false);
            } else {
                toast.error(result.message || "Failed to send feedback. Please try again.", {
                    id: toastId,
                });
            }
        } catch (error) {
            toast.error("Failed to send feedback. Please try again.", {
                id: toastId,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    return (
        <>
            {/* Floating Help Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-110 hover:rotate-12 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                aria-label="Get help or send feedback"
            >
                <QuestionMarkCircleIcon className="w-6 h-6 mx-auto" />
            </button>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-3xl shadow-xl w-full max-w-[90%] sm:max-w-[50%] md:max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 pb-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                    <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Send Feedback</h3>
                                    <p className="text-xs text-gray-500 mt-1">We&apos;d love to hear from you</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Name Field */}
                                <div>
                                    <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        {...register("name", {
                                            required: "Name is required",
                                            minLength: { value: 2, message: "Name must be at least 2 characters" }
                                        })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-500"
                                        placeholder="Your name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                                        Email <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        {...register("email", {
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email address"
                                            }
                                        })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-500"
                                        placeholder="your@email.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Message Field */}
                                <div>
                                    <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-1">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        {...register("message", {
                                            required: "Message is required",
                                            minLength: { value: 10, message: "Message must be at least 10 characters" }
                                        })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white resize-none transition-all text-sm text-gray-900 placeholder-gray-500"
                                        placeholder="Tell us about your experience, report a bug, or suggest an improvement..."
                                    />
                                    {errors.message && (
                                        <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                                    )}
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex space-x-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                                    >
                                        {isSubmitting ? "Sending..." : "Send Feedback"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}