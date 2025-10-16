"use client";

import { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authenticate } from "@/app/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import ForgottenPasswordModal from "./reset-password-modal";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { LoginPageFormData } from "@/app/lib/types";
import Link from "next/link";
import { saveAccount } from "@/app/lib/account-storage";

export default function LoginForm() {
    const [isPending, setIsPending] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgottenPasswordModal, setShowForgottenPasswordModal] =
        useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for verified email in URL params
    const isVerified = searchParams.get("verified") === "true";
    const verifiedEmail = searchParams.get("email") || "";

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<LoginPageFormData>({
        mode: "onSubmit",
        defaultValues: {
            email: verifiedEmail || "",
            password: "",
        },
    });

    // Show success message and pre-fill email if user just verified
    useEffect(() => {
        if (isVerified && verifiedEmail) {
            toast.success("Email verified successfully! Please enter your password to login.", {
                duration: 5000,
                icon: '✅'
            });
            setValue("email", verifiedEmail);
        }

        // Check for welcome message from registration
        const message = searchParams.get("message");
        if (message === "name-updated") {
            toast.success("Name updated successfully! Please login again.");
        }

        // Check for redirect parameter
        const redirect = searchParams.get("redirect");
        if (redirect) {
            sessionStorage.setItem("redirectAfterLogin", redirect);
        }
    }, [isVerified, verifiedEmail, searchParams, setValue]);

    const onSubmit = async (data: LoginPageFormData) => {
        const toastId = toast.loading("Logging you in...");
        setIsPending(true);

        const result = await authenticate(undefined, data);

        if (!result.response) {
            toast.error("Login failed.", { id: toastId });
        } else {
            toast.success("Successfully logged in!", { id: toastId });

            // Save account for quick switching (name will be available after redirect)
            // We'll also save it in the account page to ensure we have the user's name
            saveAccount(data.email, data.email.split('@')[0]);

            // Check for redirect URL stored in sessionStorage
            const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
            if (redirectUrl) {
                sessionStorage.removeItem("redirectAfterLogin");
                router.push(redirectUrl);
            } else {
                router.push("/account");
            }
        }
        setIsPending(false);
    };

    const handleForgottenPasswordPress = () => {
        setShowForgottenPasswordModal(true);
    };

    return (
        <>
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-white mb-3">
                    Welcome Back
                </h1>
                <p className="text-white/90 text-lg">
                    Log in to your account
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label
                        className="block text-sm font-medium text-white mb-2"
                        htmlFor="email"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full px-4 py-3.5 bg-white/95 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-lg"
                        {...register("email", {
                            required: "Email address is required",
                            pattern: {
                                value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                                message: "Please enter a valid email address",
                            },
                        })}
                    />
                    {errors.email && (
                        <p className="text-red-300 text-sm mt-2">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        className="block text-sm font-medium text-white mb-2"
                        htmlFor="password"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="w-full px-4 py-3.5 bg-white/95 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all pr-12 shadow-lg"
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters long",
                                },
                            })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                                <EyeIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-300 text-sm mt-2">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full mt-8 px-6 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                >
                    {isPending ? "Logging in..." : "Log In"}
                </button>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                    <button
                        type="button"
                        onClick={handleForgottenPasswordPress}
                        className="text-white/80 hover:text-white underline transition-colors"
                    >
                        Forgot password?
                    </button>

                    <span className="hidden sm:block text-white/60">•</span>

                    <Link
                        href="/register"
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        Don&apos;t have an account? <span className="underline font-medium">Sign up</span>
                    </Link>
                </div>
            </form>

            {showForgottenPasswordModal && (
                <ForgottenPasswordModal
                    onClose={() => setShowForgottenPasswordModal(false)}
                />
            )}
        </>
    );
}
