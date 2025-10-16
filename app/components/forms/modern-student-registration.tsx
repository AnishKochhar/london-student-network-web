"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserRegisterFormData } from "@/app/lib/types";
import { LondonUniversities, SocietyLogos } from "@/app/lib/utils";
import { extractUniversityFromEmail, isUniversityEmail } from "@/app/lib/university-email-mapping";
import ModernFormStep from "./modern-form-step";
import { ModernInput } from "./modern-input";
import { ModernSelect } from "./modern-select";
import ErrorModal from "./error-modal";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ModernStudentRegistration() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showOtherUniversity, setShowOtherUniversity] = useState(false);
    const [showSocietyReferrer, setShowSocietyReferrer] = useState(false);
    const [showOtherSociety, setShowOtherSociety] = useState(false);
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: "",
        message: "",
    });
    const [direction, setDirection] = useState<"forward" | "backward">(
        "forward",
    );
    const totalSteps = 7;

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
        watch,
        trigger,
        setValue,
    } = useForm<UserRegisterFormData>({
        mode: "onChange",
    });

    const watchedValues = watch();

    useEffect(() => {
        setShowOtherUniversity(
            watchedValues.university === "Other (please specify)",
        );
    }, [watchedValues.university]);

    useEffect(() => {
        setShowSocietyReferrer(
            watchedValues.referrer === "Referred by a society",
        );
    }, [watchedValues.referrer]);

    useEffect(() => {
        setShowOtherSociety(
            watchedValues.societyReferrer === "Other (please specify)",
        );
    }, [watchedValues.societyReferrer]);

    // Auto-populate university email when primary email is a university email
    useEffect(() => {
        if (watchedValues.email && isUniversityEmail(watchedValues.email)) {
            // If primary email is a university email, use it for verification too
            setValue("universityEmail", watchedValues.email, { shouldValidate: true });
        }
    }, [watchedValues.email, setValue]);

    // Auto-fill university dropdown when university email is entered
    useEffect(() => {
        if (watchedValues.universityEmail) {
            const detectedUniversity = extractUniversityFromEmail(watchedValues.universityEmail);

            // Only auto-fill if:
            // 1. We detected a valid university
            // 2. University field is empty OR is still the default/unrecognized value
            if (detectedUniversity &&
                (!watchedValues.university || watchedValues.university === "")) {
                // Check if the detected university exists in our LondonUniversities list
                if (LondonUniversities.includes(detectedUniversity)) {
                    setValue("university", detectedUniversity, { shouldValidate: true });
                }
            }
        }
    }, [watchedValues.universityEmail, watchedValues.university, setValue]);

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
                const emailValid = await trigger("email");
                // Only require university email if primary email is NOT a university email
                if (watchedValues.email && !isUniversityEmail(watchedValues.email)) {
                    const uniEmailValid = await trigger("universityEmail");
                    return emailValid && uniEmailValid;
                }
                return emailValid;
            case 3:
                return await trigger(["password", "confirmPassword"]);
            case 4:
                return await trigger(["gender", "dob"]);
            case 5:
                return await trigger("university");
            case 6:
                return await trigger([
                    "graduationYear",
                    "degreeCourse",
                    "levelOfStudy",
                ]);
            case 7:
                return true;
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
                // If primary email is a university email, only that is needed
                if (watchedValues.email && isUniversityEmail(watchedValues.email)) {
                    return !!(watchedValues.email && !errors.email);
                }
                // Otherwise, both emails are required
                return !!(
                    watchedValues.email &&
                    !errors.email &&
                    watchedValues.universityEmail &&
                    !errors.universityEmail
                );
            case 3:
                return !!(
                    watchedValues.password &&
                    watchedValues.confirmPassword &&
                    !errors.password &&
                    !errors.confirmPassword
                );
            case 4:
                return !!(watchedValues.gender && watchedValues.dob);
            case 5:
                return !!(
                    watchedValues.university &&
                    (watchedValues.university !== "Other (please specify)" ||
                        watchedValues.otherUniversity)
                );
            case 6:
                return !!(
                    watchedValues.graduationYear &&
                    watchedValues.degreeCourse &&
                    watchedValues.levelOfStudy
                );
            case 7:
                return true;
            default:
                return true;
        }
    };

    const onSubmit = async (data: UserRegisterFormData) => {
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
            const response = await fetch("/api/user/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Account created successfully!", { id: toastId });
                setCurrentStep(totalSteps + 1);

                // Check if both emails are the same
                const emailsAreSame = data.email.toLowerCase() === data.universityEmail?.toLowerCase();

                if (emailsAreSame && data.universityEmail) {
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
                            const errorData = await combinedResponse.json();
                            console.error("Failed to send combined verification email:", {
                                status: combinedResponse.status,
                                error: errorData
                            });

                            // Show user-friendly message but don't block registration
                            toast(
                                "Account created! However, we couldn&apos;t send the verification email automatically. " +
                                "Please check your account page to resend verification.",
                                { duration: 8000, icon: '⚠️' }
                            );
                        } else {
                            toast.success("Verification email sent! Check your inbox and junk folder.", { duration: 6000 });
                        }
                    } catch (emailError) {
                        console.error("Error sending combined verification email:", emailError);
                        toast(
                            "Account created successfully! You can resend verification from your account page.",
                            { duration: 6000, icon: '⚠️' }
                        );
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

                    // Send university email verification (required for all students)
                    if (data.universityEmail) {
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

    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from({ length: 11 }, (_, i) => ({
        value: (currentYear + i).toString(),
        label: (currentYear + i).toString(),
    }));

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
                    title="What's your email?"
                    // subtitle="Your primary email for LSN, plus university email for verification"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={nextStep}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    direction={direction}
                    onStepClick={handleStepClick}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-gray-300 text-left block text-sm font-medium">
                                Email <span className="text-red-300">*</span>
                            </label>
                            <ModernInput
                                type="email"
                                placeholder="your.email@example.com"
                                error={errors.email?.message}
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                            {watchedValues.email && isUniversityEmail(watchedValues.email) && (
                                <p className="text-green-400 text-xs mt-2 transition-all duration-300">
                                    ✓ University email detected - we&apos;ll use this for verification
                                </p>
                            )}
                        </div>

                        {/* Show university email field only if primary email is valid but NOT a university email */}
                        {watchedValues.email &&
                         !errors.email &&
                         !isUniversityEmail(watchedValues.email) && (
                            <div
                                className="space-y-2 animate-[slideDown_0.3s_ease-out] opacity-0 [animation-fill-mode:forwards]"
                                style={{
                                    animationDelay: '0.1s'
                                }}
                            >
                                <label className="text-gray-300 text-left block text-sm font-medium">
                                    University Email <span className="text-red-300">*</span>
                                </label>
                                <ModernInput
                                    type="email"
                                    placeholder="your.name@university.edu or university.ac.uk"
                                    error={errors.universityEmail?.message}
                                    {...register("universityEmail", {
                                        required: !isUniversityEmail(watchedValues.email) ? "University email is required for student accounts" : false,
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(ac\.uk|edu)$/i,
                                            message: "Must be a valid university email (.ac.uk or .edu)",
                                        },
                                        validate: {
                                            isRecognizedUniversity: (value) => {
                                                if (!value) return true;
                                                const university = extractUniversityFromEmail(value);
                                                return university !== null || "University domain not recognized. Please contact support.";
                                            },
                                        },
                                    })}
                                />
                                {watchedValues.universityEmail && extractUniversityFromEmail(watchedValues.universityEmail) && (
                                    <p className="text-green-400 text-xs">
                                        ✓ {extractUniversityFromEmail(watchedValues.universityEmail)}
                                    </p>
                                )}
                                {watchedValues.universityEmail && isUniversityEmail(watchedValues.universityEmail) && !extractUniversityFromEmail(watchedValues.universityEmail) && (
                                    <p className="text-yellow-400 text-xs">
                                        ⚠ University not recognized
                                    </p>
                                )}
                            </div>
                        )}

                        {watchedValues.email && !errors.email && !isUniversityEmail(watchedValues.email) && (
                            <div className="p-3 bg-gray-800/30 border border-gray-600/20 rounded-lg text-xs text-gray-300 animate-[fadeIn_0.3s_ease-out] opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '0.2s' }}>
                                💡 Your primary email is used for all your LSN activities, we use your university email for student status verification only.
                            </div>
                        )}
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 3 && (
                <ModernFormStep
                    key="step3"
                    title="Create a password"
                    subtitle="Choose a strong password to keep your account secure"
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
                                    value === getValues("password") ||
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

            {currentStep === 4 && (
                <ModernFormStep
                    key="step4"
                    title="Tell us about yourself"
                    subtitle="This helps us personalise your experience"
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
                                { value: "", label: "Select gender" },
                                { value: "Male", label: "Male" },
                                { value: "Female", label: "Female" },
                                { value: "Other", label: "Prefer not to say" },
                            ]}
                            error={errors.gender?.message}
                            {...register("gender", {
                                required: "Please select your gender",
                            })}
                        />
                        <div className="space-y-2">
                            <label className="text-gray-300 text-left block text-sm">
                                What&apos;s your birthdate?
                            </label>
                            <ModernInput
                                type="date"
                                placeholder="Date of Birth"
                                error={errors.dob?.message}
                                {...register("dob", {
                                    required: "Date of birth is required",
                                    validate: {
                                        isAdult: (value) => {
                                            if (!value) return true; // Let 'required' handle empty
                                            const birthDate = new Date(value);
                                            const today = new Date();
                                            const age = today.getFullYear() - birthDate.getFullYear();
                                            const monthDiff = today.getMonth() - birthDate.getMonth();
                                            const dayDiff = today.getDate() - birthDate.getDate();

                                            // Check if they've had their birthday this year
                                            const hasHadBirthdayThisYear = monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0);
                                            const actualAge = hasHadBirthdayThisYear ? age : age - 1;

                                            return actualAge >= 18 || "You must be at least 18 years old to register";
                                        },
                                    },
                                })}
                            />
                        </div>
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 5 && (
                <ModernFormStep
                    key="step5"
                    title="Which university do you attend?"
                    subtitle="This helps us connect you with relevant events and societies"
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
                                { value: "", label: "Select Institution" },
                                ,
                                ...universityOptions,
                            ]}
                            error={errors.university?.message}
                            {...register("university", {
                                required: "Please select your university",
                            })}
                        />
                        {showOtherUniversity && (
                            <ModernInput
                                placeholder="Enter your university name"
                                error={errors.otherUniversity?.message}
                                {...register("otherUniversity", {
                                    required: "Please specify your university",
                                })}
                            />
                        )}
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 6 && (
                <ModernFormStep
                    key="step6"
                    title="What are you studying?"
                    subtitle="Tell us about your academic journey"
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
                                { value: "", label: "When will you graduate?" },
                                ...graduationYears,
                            ]}
                            error={errors.graduationYear?.message}
                            {...register("graduationYear", {
                                required: "Please select your graduation year",
                            })}
                        />
                        <ModernInput
                            placeholder="Degree Course (e.g. Computer Science)"
                            error={errors.degreeCourse?.message}
                            {...register("degreeCourse", {
                                required: "Please enter your degree course",
                            })}
                        />
                        <ModernSelect
                            options={[
                                {
                                    value: "",
                                    label: "What level of study are you?",
                                },
                                {
                                    value: "Undergraduate",
                                    label: "Undergraduate",
                                },
                                {
                                    value: "Postgraduate",
                                    label: "Postgraduate",
                                },
                                { value: "Doctoral", label: "PhD" },
                                { value: "Alumni", label: "Alumni" },
                                { value: "Other", label: "Other" },
                            ]}
                            error={errors.levelOfStudy?.message}
                            {...register("levelOfStudy", {
                                required: "Please select your level of study",
                            })}
                        />
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 7 && (
                <ModernFormStep
                    key="step7"
                    title="How did you hear about us?"
                    subtitle="This is optional but helps us improve"
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
                        <ModernSelect
                            options={[
                                { value: "", label: "Select an option" },
                                {
                                    value: "Referred by a society",
                                    label: "Referred by a society",
                                },
                                { value: "Friend", label: "Friend or family" },
                                {
                                    value: "Social Media",
                                    label: "Social media",
                                },
                                {
                                    value: "University",
                                    label: "University/college",
                                },
                                { value: "Event", label: "At an event" },
                                { value: "Other", label: "Other" },
                            ]}
                            placeholder="How did you hear about us? (optional)"
                            {...register("referrer")}
                        />
                        {showSocietyReferrer && (
                            <ModernSelect
                                options={[
                                    { value: "", label: "Select a society" },
                                    ...SocietyLogos.map((society) => ({
                                        value: society.name,
                                        label: society.name,
                                    })),
                                    {
                                        value: "Other (please specify)",
                                        label: "Other (please specify)",
                                    },
                                ]}
                                placeholder="Which society referred you?"
                                {...register("societyReferrer")}
                            />
                        )}
                        {showOtherSociety && (
                            <ModernInput
                                placeholder="Enter society name"
                                {...register("otherSocietyReferrer")}
                            />
                        )}
                        <div className="flex items-center justify-center mt-6">
                            <label className="flex items-center text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mr-3 w-4 h-4"
                                    {...register("isNewsletterSubscribed")}
                                />
                                <span className="text-sm">
                                    Subscribe to our newsletter for updates
                                </span>
                            </label>
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
