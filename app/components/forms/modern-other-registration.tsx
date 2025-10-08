"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OtherRegisterFormData } from "@/app/lib/types";
import { LondonUniversities } from "@/app/lib/utils";
import ModernFormStep from "./modern-form-step";
import { ModernInput } from "./modern-input";
import { ModernSelect } from "./modern-select";
import ErrorModal from "./error-modal";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ModernOtherRegistration() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showOtherUniversity, setShowOtherUniversity] = useState(false);
    const [showOtherAccountType, setShowOtherAccountType] = useState(false);
    const [showUniversityEmail, setShowUniversityEmail] = useState(false);
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: "",
        message: "",
    });
    const [direction, setDirection] = useState<"forward" | "backward">(
        "forward",
    );
    const totalSteps = 4;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        trigger,
    } = useForm<OtherRegisterFormData>({
        mode: "onChange",
        defaultValues: {
            wantsUniversityVerification: false,
        },
    });

    const watchedValues = watch();

    useEffect(() => {
        setShowOtherAccountType(watchedValues.accountType === "external");
    }, [watchedValues.accountType]);

    useEffect(() => {
        setShowUniversityEmail(watchedValues.wantsUniversityVerification);
    }, [watchedValues.wantsUniversityVerification]);

    useEffect(() => {
        setShowOtherUniversity(
            watchedValues.university === "Other (please specify)",
        );
    }, [watchedValues.university]);

    const nextStep = async () => {
        const isValid = await validateCurrentStep();
        if (isValid && currentStep < totalSteps) {
            setDirection("forward");
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep === 1) {
            router.push("/register");
        } else if (currentStep > 1) {
            setDirection("backward");
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = (step: number) => {
        if (step < currentStep) {
            setDirection("backward");
            setCurrentStep(step);
        }
    };

    const validateCurrentStep = async () => {
        switch (currentStep) {
            case 1:
                return await trigger([
                    "firstname",
                    "surname",
                    "hasAgreedToTerms",
                ]);
            case 2:
                return await trigger("accountType");
            case 3:
                const emailValid = await trigger("email");
                if (!emailValid) return false;
                if (watchedValues.wantsUniversityVerification) {
                    return await trigger("universityEmail");
                }
                return true;
            case 4:
                return await trigger(["password", "confirmPassword"]);
            default:
                return true;
        }
    };

    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return !!(
                    watchedValues.firstname &&
                    watchedValues.surname &&
                    watchedValues.hasAgreedToTerms
                );
            case 2:
                const hasAccountType = !!watchedValues.accountType;
                if (watchedValues.accountType === "external") {
                    return !!(hasAccountType && watchedValues.otherAccountType);
                }
                return hasAccountType;
            case 3:
                const hasEmail = watchedValues.email && !errors.email;
                if (watchedValues.wantsUniversityVerification) {
                    const hasUniEmail = watchedValues.universityEmail && !errors.universityEmail;
                    return !!(hasEmail && hasUniEmail);
                }
                return !!hasEmail;
            case 4:
                return !!(
                    watchedValues.password &&
                    watchedValues.confirmPassword &&
                    !errors.password &&
                    !errors.confirmPassword
                );
            default:
                return true;
        }
    };

    const onSubmit = async (data: OtherRegisterFormData) => {
        const toastId = toast.loading("Creating your account...");

        try {
            const emailCheck = await fetch("/api/user/check-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });
            const emailResult = await emailCheck.json();
            if (emailResult.emailTaken) {
                toast.dismiss(toastId);
                setErrorModal({
                    isOpen: true,
                    title: "Email Already Exists",
                    message:
                        "An account with this email address already exists. Please use a different email or try logging in.",
                });
                return;
            }
        } catch (error) {
            toast.dismiss(toastId);
            setErrorModal({
                isOpen: true,
                title: "Connection Error",
                message:
                    "Unable to verify email address. Please check your connection and try again.",
            });
            return;
        }

        try {
            const response = await fetch("/api/user/create-other", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Account created successfully!", { id: toastId });
                setCurrentStep(totalSteps + 1);

                // Check if both emails are the same and university verification is wanted
                const emailsAreSame = data.wantsUniversityVerification &&
                    data.universityEmail &&
                    data.email.toLowerCase() === data.universityEmail.toLowerCase();

                if (emailsAreSame) {
                    // Send single combined verification email
                    try {
                        const combinedResponse = await fetch("/api/email/send-combined-verification-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId: result.id,
                                email: data.universityEmail
                            }),
                        });

                        if (!combinedResponse.ok) {
                            console.error("Failed to send combined verification email");
                            toast.error("Warning: Verification email may not have been sent. Please contact support.");
                        }
                    } catch (emailError) {
                        console.error("Error sending combined verification email:", emailError);
                    }
                } else {
                    // Send separate verification emails
                    // Send primary email verification
                    try {
                        const emailResponse = await fetch("/api/email/send-verification-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: data.email }),
                        });

                        if (!emailResponse.ok) {
                            console.error("Failed to send primary verification email");
                            toast.error("Warning: Verification email may not have been sent. Please contact support.");
                        }
                    } catch (emailError) {
                        console.error("Error sending primary verification email:", emailError);
                    }

                    // Send university email verification if requested
                    if (data.wantsUniversityVerification && data.universityEmail) {
                        try {
                            const uniEmailResponse = await fetch("/api/email/send-university-verification-email", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    userId: result.id,
                                    universityEmail: data.universityEmail
                                }),
                            });

                            if (!uniEmailResponse.ok) {
                                console.error("Failed to send university verification email");
                                toast.error("Warning: University verification email may not have been sent. You can verify later from your account page.");
                            }
                        } catch (emailError) {
                            console.error("Error sending university verification email:", emailError);
                        }
                    }
                }
            } else {
                toast.error(`Error: ${result.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error("Registration failed", { id: toastId });
        }
    };

    const universityOptions = LondonUniversities.map((uni) => ({
        value: uni,
        label: uni,
    }));

    return (
        <AnimatePresence mode="wait">
            {currentStep === 1 && (
                <ModernFormStep
                    key="step1"
                    title="What's your name?"
                    subtitle="We'll use this to personalise your experience"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={nextStep}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    direction={direction}
                    onStepClick={handleStepClick}
                >
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <ModernInput
                                placeholder="First Name"
                                error={errors.firstname?.message}
                                {...register("firstname", {
                                    required: "First name is required",
                                })}
                            />
                            <ModernInput
                                placeholder="Last Name"
                                error={errors.surname?.message}
                                {...register("surname", {
                                    required: "Last name is required",
                                })}
                            />
                        </div>
                        <div className="flex items-center justify-center">
                            <label className="flex items-center text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mr-3 w-4 h-4"
                                    {...register("hasAgreedToTerms", {
                                        required: "You must agree to continue",
                                    })}
                                />
                                <span className="text-sm">
                                    I agree to the{" "}
                                    <a
                                        href="/terms-conditions"
                                        className="text-blue-400 underline"
                                        target="_blank"
                                    >
                                        terms and conditions
                                    </a>
                                    {" "}and{" "}
                                    <a
                                        href="/privacy-policy"
                                        className="text-blue-400 underline"
                                        target="_blank"
                                    >
                                        privacy policy
                                    </a>
                                </span>
                            </label>
                        </div>
                        {errors.hasAgreedToTerms && (
                            <p className="text-red-400 text-center text-sm">
                                {errors.hasAgreedToTerms.message}
                            </p>
                        )}
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 2 && (
                <ModernFormStep
                    key="step2"
                    title="How would you describe yourself?"
                    subtitle="This helps us personalize your experience"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={nextStep}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    direction={direction}
                    onStepClick={handleStepClick}
                >
                    <div className="space-y-4">
                        <ModernSelect
                            options={[
                                { value: "", label: "Choose one" },
                                { value: "alumni", label: "Alumni (graduated from university)" },
                                { value: "staff", label: "University Staff" },
                                { value: "prospective", label: "Prospective Student" },
                                { value: "parent", label: "Parent/Guardian" },
                                { value: "educator", label: "Educator/Teacher" },
                                { value: "professional", label: "Industry Professional" },
                                { value: "community", label: "Community Member" },
                                { value: "external", label: "Other (please specify)" },
                            ]}
                            error={errors.accountType?.message}
                            {...register("accountType", {
                                required: "Please select an option",
                            })}
                        />
                        {showOtherAccountType && (
                            <ModernInput
                                placeholder="Tell us a bit about yourself"
                                error={errors.otherAccountType?.message}
                                {...register("otherAccountType", {
                                    required: "Please tell us about yourself",
                                })}
                            />
                        )}
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 3 && (
                <ModernFormStep
                    key="step3"
                    title="What's your email?"
                    subtitle="We'll send you updates and event notifications"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={nextStep}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    direction={direction}
                    onStepClick={handleStepClick}
                >
                    <div className="space-y-4">
                        <ModernInput
                            type="email"
                            placeholder="Enter your email address"
                            error={errors.email?.message}
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address",
                                },
                            })}
                        />

                        <div className="space-y-2">
                            <label className="text-gray-300 text-left block text-sm">
                                University affiliation (optional)
                            </label>
                            <ModernSelect
                                options={[
                                    { value: "", label: "Select Institution" },
                                    ...universityOptions,
                                ]}
                                {...register("university")}
                            />
                            {showOtherUniversity && (
                                <ModernInput
                                    placeholder="Enter university name"
                                    {...register("otherUniversity")}
                                />
                            )}
                            <p className="text-gray-400 text-xs">
                                This is for display purposes only
                            </p>
                        </div>

                        <div className="border-t border-white/20 pt-4">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4"
                                    {...register("wantsUniversityVerification")}
                                />
                                <div className="flex-1">
                                    <label className="text-gray-300 text-sm font-medium cursor-pointer">
                                        I have a university email (.ac.uk) and want to verify it
                                    </label>
                                    <p className="text-gray-400 text-xs mt-1">
                                        This will give you access to university-exclusive events
                                    </p>
                                </div>
                            </div>
                        </div>

                        {showUniversityEmail && (
                            <div className="space-y-2 pt-2">
                                <label className="text-gray-300 text-left block text-sm">
                                    University Email (.ac.uk)
                                </label>
                                <ModernInput
                                    type="email"
                                    placeholder="your.name@university.ac.uk"
                                    error={errors.universityEmail?.message}
                                    {...register("universityEmail", {
                                        required: watchedValues.wantsUniversityVerification
                                            ? "University email is required if you want verification"
                                            : false,
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.ac\.uk$/i,
                                            message: "Must be a valid .ac.uk university email",
                                        },
                                    })}
                                />
                                <p className="text-gray-400 text-xs">
                                    We&apos;ll automatically detect your university from your email domain and send a verification email
                                </p>
                            </div>
                        )}
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 4 && (
                <ModernFormStep
                    key="step4"
                    title="Create a password"
                    subtitle="Choose a strong password to keep your account secure"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={handleSubmit(onSubmit)}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    isLastStep={true}
                    direction={direction}
                    onStepClick={handleStepClick}
                >
                    <div className="space-y-4">
                        <ModernInput
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            error={errors.password?.message}
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 8,
                                    message:
                                        "Password must be at least 8 characters",
                                },
                            })}
                        />
                        <ModernInput
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            error={errors.confirmPassword?.message}
                            {...register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (value) =>
                                    value === watch("password") ||
                                    "Passwords do not match",
                            })}
                        />
                        <div className="flex justify-center mt-4">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                                <span>
                                    {showPassword
                                        ? "Hide password"
                                        : "Show password"}
                                </span>
                            </button>
                        </div>
                    </div>
                </ModernFormStep>
            )}


            {currentStep === totalSteps + 1 && (
                <ModernFormStep
                    key="success"
                    title="Welcome to LSN!"
                    subtitle="Please check your email to verify your account"
                    currentStep={totalSteps}
                    totalSteps={totalSteps}
                    onNext={() => {}}
                    onBack={() => {}}
                    canContinue={false}
                    direction={direction}
                >
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-300">
                            Registration complete! Check your email (including junk/spam folder) for verification.
                        </p>
                    </div>
                </ModernFormStep>
            )}

            <ErrorModal
                isOpen={errorModal.isOpen}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() =>
                    setErrorModal({ isOpen: false, title: "", message: "" })
                }
            />
        </AnimatePresence>
    );
}
