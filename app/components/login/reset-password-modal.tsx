"use client";

import { useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "../button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Input } from "../input";

export default function ForgottenPasswordModal({
    onClose,
}: {
    onClose: () => void;
}) {
    const [inputEmail, setInputEmail] = useState("");
    const [inputDisabled, setInputDisabled] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setInputDisabled(true);

        const toastId = toast.loading("Sending password reset email...");

        try {
            const response = await fetch("/api/forgotten-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: inputEmail }),
            });

            if (response.ok) {
                toast.success("Password reset email sent!", { id: toastId });
            } else {
                toast.error("Failed to send the email.", { id: toastId });
            }
        } catch (error) {
            console.error("Error sending the email:", error);
            toast.error("An error occurred. Please try again.", {
                id: toastId,
            });
        }
        setInputDisabled(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-black">
                        Forgotten Password
                    </h2>
                    <Button variant="ghost" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                    </Button>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                    Please enter your email address to reset your password. We
                    will notify the team of your issue and have it resolved as
                    soon as possible
                </p>
                <form onSubmit={handleSubmit} className="mt-10 space-y-4">
                    <Input
                        id="forgottenEmail"
                        type="email"
                        name="forgottenEmail"
                        placeholder="Enter your email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        required
                        className="bg-transparet text-black"
                        disabled={inputDisabled}
                    />
                    <Button
                        variant="filled"
                        size="md"
                        className="w-full justify-center self-center"
                        disabled={inputDisabled}
                    >
                        Submit
                    </Button>
                </form>
            </div>
        </div>
    );
}
