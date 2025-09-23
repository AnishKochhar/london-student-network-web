"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckIcon, SparklesIcon, UserIcon } from "@heroicons/react/24/outline";
import { UsernameFormData, UsernameCheckResponse, CreateUsernameResponse } from "@/app/lib/types";
import toast from "react-hot-toast";
import BaseModal from "./base-modal";

interface UsernameCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (username: string) => void;
}

export default function UsernameCreationModal({
    isOpen,
    onClose,
    onSuccess
}: UsernameCreationModalProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [usernameStatus, setUsernameStatus] = useState<{
        available?: boolean;
        error?: string;
    }>({});

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset
    } = useForm<UsernameFormData>();

    const watchedUsername = watch("username");

    // Load initial suggestions when modal opens
    useEffect(() => {
        if (isOpen) {
            loadSuggestions();
        }
    }, [isOpen]);

    // Check username availability as user types
    useEffect(() => {
        if (watchedUsername && watchedUsername.length >= 3) {
            const debounceTimer = setTimeout(() => {
                checkUsernameAvailability(watchedUsername);
            }, 500);

            return () => clearTimeout(debounceTimer);
        } else {
            setUsernameStatus({});
        }
    }, [watchedUsername]);

    const loadSuggestions = async () => {
        try {
            const response = await fetch("/api/username/suggestions");
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.suggestions || []);
            }
        } catch (error) {
            console.error("Error loading suggestions:", error);
        }
    };

    const checkUsernameAvailability = async (username: string) => {
        setIsChecking(true);
        try {
            const response = await fetch("/api/username/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });

            const data: UsernameCheckResponse = await response.json();
            setUsernameStatus({
                available: data.available,
                error: data.error
            });

            if (data.suggestions && data.suggestions.length > 0) {
                setSuggestions(data.suggestions);
            }
        } catch (error) {
            console.error("Error checking username:", error);
            setUsernameStatus({ error: "Error checking username availability" });
        } finally {
            setIsChecking(false);
        }
    };

    const onSubmit = async (data: UsernameFormData) => {
        if (!usernameStatus.available) {
            toast.error("Please choose an available username");
            return;
        }

        setIsCreating(true);
        const toastId = toast.loading("Creating username...");

        try {
            const response = await fetch("/api/username/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: data.username })
            });

            const result: CreateUsernameResponse = await response.json();

            if (result.success && result.username) {
                toast.success("Username created successfully!", { id: toastId });
                onSuccess(result.username);
                reset();
                onClose();
            } else {
                toast.error(result.error || "Failed to create username", { id: toastId });
            }
        } catch (error) {
            console.error("Error creating username:", error);
            toast.error("Error creating username", { id: toastId });
        } finally {
            setIsCreating(false);
        }
    };

    const selectSuggestion = (suggestion: string) => {
        setValue("username", suggestion);
    };

    const modalFooter = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="username-form"
                disabled={!usernameStatus.available || isCreating || isChecking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isCreating ? "Creating..." : "Create Username"}
            </button>
        </>
    );

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div>
                    <div className="flex items-center gap-2">
                        Create Your Username
                    </div>
                    <p className="text-sm text-white/70 mt-1 font-normal">Choose a unique username for the forum</p>
                </div>
            }
            icon={<UserIcon className="w-6 h-6" />}
            footer={modalFooter}
            maxWidth="max-w-md"
            isSubmitting={isCreating}
        >
            <div className="max-h-[60vh] overflow-y-auto space-y-6">
                <form id="username-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                {...register("username", {
                                    required: "Username is required",
                                    minLength: {
                                        value: 3,
                                        message: "Username must be at least 3 characters"
                                    },
                                    maxLength: {
                                        value: 30,
                                        message: "Username must be no more than 30 characters"
                                    },
                                    pattern: {
                                        value: /^[a-zA-Z0-9_-]+$/,
                                        message: "Username can only contain letters, numbers, underscores, and hyphens"
                                    }
                                })}
                                className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors text-white placeholder-white/50 ${
                                    errors.username ? "border-red-400 ring-1 ring-red-400" :
                                    usernameStatus.available ? "border-green-400 ring-1 ring-green-400" :
                                    usernameStatus.error ? "border-red-400 ring-1 ring-red-400" : ""
                                }`}
                                placeholder="Enter your username"
                            />

                            {/* Status Icons */}
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {isChecking && (
                                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {!isChecking && usernameStatus.available && (
                                    <CheckIcon className="h-5 w-5 text-green-400" />
                                )}
                                {!isChecking && usernameStatus.error && (
                                    <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">✕</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Messages */}
                        {errors.username && (
                            <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
                        )}
                        {usernameStatus.error && (
                            <p className="text-red-400 text-sm mt-1">{usernameStatus.error}</p>
                        )}
                        {usernameStatus.available && (
                            <p className="text-green-400 text-sm mt-1">✓ Username is available!</p>
                        )}
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <SparklesIcon className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-white">Suggestions</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => selectSuggestion(suggestion)}
                                        className="px-3 py-2 text-sm bg-white/10 hover:bg-blue-500/30 border border-white/20 hover:border-blue-400 rounded-lg transition-colors text-left text-white"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Username Rules */}
                    <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-2">Username Rules:</h4>
                        <ul className="text-xs text-white/70 space-y-1">
                            <li>• 3-30 characters long</li>
                            <li>• Letters, numbers, underscores, and hyphens only</li>
                            <li>• Cannot start or end with underscore or hyphen</li>
                            <li>• Must be unique</li>
                        </ul>
                    </div>
                </form>
            </div>
        </BaseModal>
    );
}