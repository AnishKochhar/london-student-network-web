"use client";

import { useState, useEffect } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { Button } from "../button";
import { authenticate } from "@/app/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../input";
import ForgottenPasswordModal from "./reset-password-modal";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { LoginPageFormData } from "@/app/lib/types";

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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="flex-1 flex-col items-center rounded-lg bg-gray-50 px-6 pb-4 pt-8 text-black">
                    <h1 className="mb-3 text-xl ">
                        Please enter your details to log in
                    </h1>
                    <div className="w-full">
                        <div>
                            <label
                                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <Input
                                    className="bg-transparent text-black text-center"
                                    id="email"
                                    type="email"
                                    placeholder="Email Address"
                                    {...register("email", {
                                        required: "Email address is required",
                                        pattern: {
                                            value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                                            message:
                                                "Please enter a valid email address",
                                        },
                                    })}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <label
                                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    className="bg-transparent text-black text-center peer"
                                    id="password"
                                    placeholder="Enter your password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 6,
                                            message:
                                                "Password must be at least 6 characters long",
                                        },
                                    })}
                                />
                                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Show password toggle */}
                            <div className="mt-2 self-end">
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={showPassword}
                                        onChange={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="mr-2"
                                    />
                                    Show password
                                </label>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="filled"
                        size="md"
                        type="submit"
                        className="mt-4 w-full"
                        aria-disabled={isPending}
                    >
                        Log in{" "}
                        <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
                    </Button>
                    <div className="w-full flex flex-row items-center justify-center pt-2">
                        <Button
                            variant="ghost"
                            size="md"
                            className="hover:text-gray-400"
                            onClick={handleForgottenPasswordPress}
                        >
                            Forgotten password?
                        </Button>
                    </div>
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
