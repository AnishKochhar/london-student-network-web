"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/app/components/button"; // Assume you have a custom button component
import { SocietyMessageFormData } from "@/app/lib/types";
import { useParams } from "next/navigation";

export default function SendEmailPage({
    className = "min-h-screen flex flex-col justify-start p-10 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]",
}: {
    className?: string;
}) {
    const [partner, setPartner] = useState({ name: "" });
    const { id } = useParams(); // Use useParams for dynamic routing to get the dynamic id from the URL
    const { data: session, status } = useSession();
    const { register, handleSubmit } = useForm<SocietyMessageFormData>({
        mode: "onSubmit",
        defaultValues: {
            subject: "",
            message: "",
        },
    });

    const router = useRouter();

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
                toast.success("Email sent successfully!", { id: toastId });
                router.push("/societies/thank-you"); // Redirect to thank-you page after sending email
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
        <div className={className}>
            <h1 className="text-3xl font-semibold mb-6 ml-10 text-white">
                Send a Message to {partner.name}
            </h1>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full px-6 mb-10 mt-10"
            >
                {/* Must be logged in message */}
                {!session && (
                    <div className="mb-4">
                        <h2 className="text-white">
                            Please log in to submit a message
                        </h2>
                    </div>
                )}

                {/* Email Subject */}
                <div className="mb-4 w-full max-w-[1200px] ml-4 mr-auto">
                    <label className="block text-white font-bold mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        placeholder="Enter email subject"
                        {...register("subject", { required: true })}
                        className="w-full p-2 border border-gray-300 rounded bg-transparent text-white placeholder-gray-500"
                    />
                </div>

                {/* Email Message */}
                <div className="mb-4 w-full max-w-[1200px] ml-4 mr-auto">
                    <label className="block text-white font-bold">
                        Message
                    </label>
                    <textarea
                        rows={6}
                        placeholder="Enter your message"
                        {...register("message", { required: true })}
                        className="w-full p-3 mt-2 border border-gray-300 rounded-lg text-white placeholder-gray-500 bg-transparent"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end items-center">
                    <Button
                        variant="outline"
                        onClick={handleSubmit(onSubmit)}
                        className="bg-transparent text-white py-2 px-6 rounded-lg border-2 border-[#3c82f6] hover:bg-blue-900"
                    >
                        Send Email
                    </Button>
                </div>
            </form>
        </div>
    );
}
