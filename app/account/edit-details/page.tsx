"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import ImageUpload from "@/app/components/account/logo-edit";
import { OrganiserAccountEditFormData } from "@/app/lib/types";
import { upload } from "@vercel/blob/client";
import { Input } from "../../components/input";
import { Button } from "@/app/components/button";
import MarkdownEditor from "@/app/components/markdown/markdown-editor";
import CategoryTagsSelect from "@/app/components/forms/category-tags-select";
import { ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function EditDetailsPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [initialData, setInitialData] = useState<OrganiserAccountEditFormData | null>(null);
    const hasFetchedRef = useRef(false); // Track if we've already fetched

    const { data: session, status } = useSession();
    const router = useRouter();

    const { register, handleSubmit, control, reset, setValue, formState: { isDirty } } =
        useForm<OrganiserAccountEditFormData>({
            mode: "onSubmit",
            defaultValues: {
                tags: [],
                description: "",
                website: "",
            },
        });


    // Track form changes
    useEffect(() => {
        setHasUnsavedChanges(isDirty);
    }, [isDirty]);

    // Warn user before leaving with unsaved changes (browser navigation)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && !isSubmitting) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, isSubmitting]);


    const onSubmit = async (data: OrganiserAccountEditFormData) => {
        setIsSubmitting(true);
        const toastId = toast.loading("Updating your society's details...");

        if (data.uploadedImage && typeof data.uploadedImage !== "string") {
            try {
                const newBlob = await upload(
                    data.uploadedImage.name,
                    data.uploadedImage,
                    {
                        access: "public",
                        handleUploadUrl: "/api/upload-image",
                    },
                );

                data.imageUrl = newBlob.url;
            } catch (error) {
                toast.error(`Error uploading image: ${error.message}`, {
                    id: toastId,
                });
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const res = await fetch("/api/user/update-account-fields", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: session?.user?.id, data: data }),
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Society updated successfully!", { id: toastId });
                setHasUnsavedChanges(false); // Clear unsaved changes before redirecting
                router.push("/account");
            } else {
                toast.error(`Error updating account: ${result.error}`, {
                    id: toastId,
                });
                console.error("Error updating account:", result.error);
            }
        } catch (error) {
            toast.error(`Error during account update: ${error.message}`, {
                id: toastId,
            });
            console.error("Error during account update:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch account data once when authenticated
    useEffect(() => {
        // Only run when auth status changes to authenticated
        if (status !== "authenticated") return;
        if (!session?.user?.id) return;

        // Only fetch once
        if (hasFetchedRef.current) return;

        const fetchAccountInfo = async () => {
            try {
                const res = await fetch("/api/user/get-account-fields", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(session.user.id),
                });
                const { description, website, tags } = await res.json();

                setInitialData({
                    uploadedImage: null,
                    imageUrl: null,
                    description: description || "",
                    website: website || "",
                    tags: tags || [],
                });
                hasFetchedRef.current = true;
            } catch (error) {
                console.error("Error loading account details:", error);
                toast.error("Failed to load account details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccountInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]); // Only re-run when auth status changes

    // Reset form when initial data is loaded (only once)
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/60">Loading your details...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const { user } = session;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => {
                            if (hasUnsavedChanges && !isSubmitting) {
                                if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                                    router.push("/account");
                                }
                            } else {
                                router.push("/account");
                            }
                        }}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 group"
                        disabled={isSubmitting}
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Account</span>
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-white">Edit Details</h1>
                        {hasUnsavedChanges && !isSubmitting && (
                            <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                Unsaved changes
                            </span>
                        )}
                    </div>
                    <p className="text-white/60">Update your society&apos;s information and settings</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Society Logo */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all hover:border-white/20">
                        <label className="block text-white font-semibold mb-4">
                            Society Logo
                        </label>
                        <ImageUpload
                            register={register}
                            setValue={setValue}
                            id={session?.user?.id}
                        />
                    </div>

                    {/* Read-only Information */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all hover:border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                        <p className="text-sm text-white/50 mb-4">These fields cannot be edited. Contact us to make changes.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={user.name}
                                    disabled
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={user.role}
                                    disabled
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Editable Information */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all hover:border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Society Details</h3>

                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-2">
                                    Description
                                </label>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <MarkdownEditor
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Write your society's description here... Markdown is supported!"
                                            height={300}
                                            variant="dark"
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-2">
                                    Website
                                </label>
                                <Input
                                    type="url"
                                    placeholder="https://your-society-website.com"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    {...register("website")}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-4">
                                    Tags <span className="text-white/50 text-xs">(Max 3)</span>
                                </label>
                                <Controller
                                    name="tags"
                                    control={control}
                                    render={({ field }) => (
                                        <CategoryTagsSelect
                                            value={field.value || []}
                                            onChange={(selectedValues) => {
                                                if (selectedValues.length > 3) {
                                                    toast.error(
                                                        "You can only select up to 3 tags",
                                                    );
                                                    return;
                                                }
                                                field.onChange(selectedValues);
                                            }}
                                            maxTags={3}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-blue-300">
                            💡 To change your name, email, or role, please contact us at{' '}
                            <a
                                href="mailto:hello@londonstudentnetwork.com"
                                className="underline hover:text-blue-200 transition-colors"
                            >
                                hello@londonstudentnetwork.com
                            </a>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (hasUnsavedChanges && !isSubmitting) {
                                    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                                        router.push("/account");
                                    }
                                } else {
                                    router.push("/account");
                                }
                            }}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-white/5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="filled"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
