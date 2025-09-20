"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { ResetPasswordFormData } from "../lib/types";
import toast from "react-hot-toast";
import { Input } from "../components/input";
import { Button } from "../components/button";
import { FlagIcon } from "@heroicons/react/24/outline";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPassword />
        </Suspense>
    );
}

function ResetPassword() {
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
        getValues,
    } = useForm<ResetPasswordFormData>({
        mode: "onSubmit",
    });

    const [status, setStatus] = useState<
        "loading" | "valid" | "invalid" | "expired"
    >("loading");
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const validateToken = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setStatus("invalid");
                return;
            }

            try {
                const response = await fetch("/api/validate-token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token: token }),
                });

                const data = await response.json();

                if (data.success) {
                    if (data.message === "valid") {
                        setStatus("valid");
                    } else if (data.message === "invalid") {
                        setStatus("invalid");
                    } else if (data.message === "expired") {
                        setStatus("expired");
                    }
                } else {
                    console.error("Error validating token:", data.error);
                    setStatus("invalid");
                }
            } catch (error) {
                console.error("Error validating token:", error);
                setStatus("invalid");
            }
        };

        validateToken();
    }, [searchParams]); // this may need to be empty, as may lead to infinite loop

    const onSubmit = async (formData: ResetPasswordFormData) => {
        const token = searchParams.get("token");

        if (!token) {
            toast.error("Invalid token.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("confirmPassword", { message: "Passwords do not match" });
            return;
        }

        clearErrors("confirmPassword");

        try {
            const response = await fetch(`/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: formData.password }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Password reset successfully!");
                router.push("/login");
            } else {
                toast.error(data.error || "Failed to reset password");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("An unexpected error occurred. Please re-try");
        }
    };

    if (status === "loading") {
        return (
            <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
                Loading...
            </main>
        );
    }

    if (status === "invalid") {
        return (
            <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
                Invalid token. Please request a new password reset.
            </main>
        );
    }

    if (status === "expired") {
        return (
            <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
                Your token has expired. Please request a new password reset.
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
            <h1 className="text-2xl p-10 text-center y-8 sm:my-8 tracking-wide capitalize">
                Reset Your Password
            </h1>
            <div className="w-full md:w-2/3 p-12">
                <p className="mt-10 text-gray-300">
                    Please set a <i>strong</i> password for your account
                </p>

                <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full mt-4 p-3 bg-transparent"
                    {...register("password", {
                        required: "Password is required.",
                        minLength: {
                            value: 8,
                            message:
                                "Password must be at least 8 characters long.",
                        },
                    })}
                />

                <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="w-full mt-4 p-3 bg-transparent"
                    {...register("confirmPassword", {
                        required: true,
                        validate: (value) =>
                            value === getValues("password") ||
                            "Passwords do not match.",
                    })}
                />
                {errors.password && (
                    <p className="text-red-500 mt-2">
                        {errors.password.message}
                    </p>
                )}
                {errors.confirmPassword && (
                    <p className="text-red-500 mt-2">
                        {errors.confirmPassword.message}
                    </p>
                )}

                {/* Show password toggle */}
                <div className="mt-2 self-end">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                            className="mr-2"
                        />
                        Show password
                    </label>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={handleSubmit(onSubmit)}
                        className="self-end mt-3 p-3 text-white rounded-lg hover:bg-slate-500"
                    >
                        Confirm Reset{" "}
                        <FlagIcon className="ml-2" width={15} height={15} />
                    </Button>
                </div>
            </div>
        </main>
    );
}
