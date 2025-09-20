"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import {
    ChevronDownIcon,
    UserIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface ContactFormData {
    inquiryPurpose: string;
    description: string;
    name: string;
    email: string;
    organisation: string;
    message: string;
}

const inquiryOptions = [
    "General Inquiry",
    "Partnership Opportunity",
    "Event Collaboration",
    "Sponsorship Interest",
    "Society Registration",
    "Student Support",
    "Media & Press",
    "Technical Support",
];

const descriptionOptions = [
    "I'm a student looking for opportunities",
    "I represent a society/organisation",
    "I'm interested in sponsoring events",
    "I'm a university administrator",
    "I'm a media representative",
    "I'm looking to partner with LSN",
    "I need technical assistance",
    "Other",
];

export default function ContactPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ContactFormData>();

    const [status, setStatus] = useState<string | null>(null);

    const onSubmit = async (data: ContactFormData) => {
        setStatus("Sending...");
        try {
            // Format data to match ContactFormInput interface
            const formattedData = {
                id: crypto.randomUUID(), // Generate unique ID
                name: data.name,
                email: data.email,
                message: `
					Inquiry Purpose: ${data.inquiryPurpose}
					Description: ${data.description}
					${data.organisation ? `Organisation: ${data.organisation}` : ""}

					Message: ${data.message}
				`.trim(),
            };

            const response = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formattedData),
            });

            if (response.ok) {
                setStatus("Form submitted successfully!");
                reset();
            } else {
                setStatus("Failed to submit the form.");
            }
        } catch (error) {
            console.error("Error submitting the form:", error);
            setStatus("An error occurred. Please try again.");
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col justify-center items-center text-center mb-6 sm:mb-0 space-y-6">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                            Let&apos;s Get In Touch
                        </h1>
                        <div className="hidden sm:flex flex-col items-center text-center justify-center">
                            <p className="text-lg mb-4 w-5/6 text-center text-gray-200">
                                Whether you have questions about how we operate,
                                enquiries about the team, or are interested in
                                sponsoring an event, we&apos;d love to hear from
                                you.
                            </p>
                            <p className="text-lg text-gray-200">
                                Please reach us by filling out the form, and one
                                of the team will get back to you as soon as
                                possible.
                            </p>
                        </div>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
                            <div className="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <EnvelopeIcon className="w-6 h-6 text-blue-300" />
                            </div>
                            <div className="space-y-2">
                                <Link
                                    href="mailto:hello@londonstudentnetwork.com"
                                    className="hover:underline font-bold"
                                >
                                    hello@londonstudentnetwork.com
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
                            <div className="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BuildingOfficeIcon className="w-6 h-6 text-blue-300" />
                            </div>
                            <div className="space-y-2">
                                <p>
                                    {" "}
                                    Bush House North Wing, Strand Campus, 30
                                    Aldwych, WC2B 4BG
                                </p>
                                <p>London, United Kingdom</p>
                                {/* <p className="text-white font-medium">London, United Kingdom</p>
								<p className="text-gray-300">Serving students across London universities</p> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="py-8">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Or fill out the form below
                        </h2>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* First Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Inquiry Purpose */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Inquiry Purpose{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        {...register("inquiryPurpose", {
                                            required:
                                                "Please select an inquiry purpose",
                                        })}
                                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white appearance-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-300"
                                    >
                                        <option
                                            value=""
                                            className="text-gray-800"
                                        >
                                            Choose one option...
                                        </option>
                                        {inquiryOptions.map((option) => (
                                            <option
                                                key={option}
                                                value={option}
                                                className="text-gray-800"
                                            >
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
                                </div>
                                {errors.inquiryPurpose && (
                                    <p className="text-red-400 text-sm mt-1">
                                        {errors.inquiryPurpose.message}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Description that fits you{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        {...register("description", {
                                            required:
                                                "Please select a description",
                                        })}
                                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white appearance-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-300"
                                    >
                                        <option
                                            value=""
                                            className="text-gray-800"
                                        >
                                            Choose one option...
                                        </option>
                                        {descriptionOptions.map((option) => (
                                            <option
                                                key={option}
                                                value={option}
                                                className="text-gray-800"
                                            >
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
                                </div>
                                {errors.description && (
                                    <p className="text-red-400 text-sm mt-1">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Second Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Full Name{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                                    <input
                                        type="text"
                                        {...register("name", {
                                            required: "Name is required",
                                        })}
                                        placeholder="Enter your full name..."
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-400 text-sm mt-1">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Email Address{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                                    <input
                                        type="email"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^\S+@\S+$/i,
                                                message:
                                                    "Invalid email address",
                                            },
                                        })}
                                        placeholder="Enter your email address..."
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-400 text-sm mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Organisation (Optional)
                            </label>
                            <div className="relative">
                                <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                                <input
                                    type="text"
                                    {...register("organisation")}
                                    placeholder="Enter your organisation..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Message <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <ChatBubbleLeftRightIcon className="absolute left-3 top-4 w-5 h-5 text-blue-300" />
                                <textarea
                                    {...register("message", {
                                        required: "Message is required",
                                    })}
                                    rows={6}
                                    placeholder="Enter your message here..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                                />
                            </div>
                            {errors.message && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.message.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={status === "Sending..."}
                                className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                Submit Form
                                <svg
                                    className="ml-2 w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="text-center">
                                <p
                                    className={`text-sm font-medium ${
                                        status.includes("success")
                                            ? "text-green-400"
                                            : status.includes("Sending")
                                              ? "text-blue-400"
                                              : "text-red-400"
                                    }`}
                                >
                                    {status}
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </main>
    );
}
