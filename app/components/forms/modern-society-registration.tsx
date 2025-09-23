"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SocietyRegisterFormData } from "@/app/lib/types";
import { LondonUniversities } from "@/app/lib/utils";
import getPredefinedTags from "@/app/lib/utils";
import ModernFormStep from "./modern-form-step";
import { ModernInput } from "./modern-input";
import { ModernSelect } from "./modern-select";
import ModernTagsSelect from "./modern-tags-select";
import ErrorModal from "./error-modal";
import {
    EyeIcon,
    EyeSlashIcon,
    ArrowUpTrayIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { upload } from "@vercel/blob/client";

import Image from "next/image";

export default function ModernSocietyRegistration() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showOtherUniversity, setShowOtherUniversity] = useState(false);
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: "",
        message: "",
    });
    const [direction, setDirection] = useState<"forward" | "backward">(
        "forward",
    );
    const [predefinedTags, setPredefinedTags] = useState([]);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const totalSteps = 5;

    const inputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
        watch,
        trigger,
        setValue,
        control,
    } = useForm<SocietyRegisterFormData>({
        mode: "onChange",
        defaultValues: {
            tags: [],
        },
    });

    const watchedValues = watch();

    useEffect(() => {
        setShowOtherUniversity(
            watchedValues.university === "Other (please specify)",
        );
    }, [watchedValues.university]);

    useEffect(() => {
        const fetchTags = async () => {
            const tags = await getPredefinedTags();
            setPredefinedTags(tags);
        };
        fetchTags();
    }, []);

    useEffect(() => {
        register("uploadedImage");
    }, [register]);

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
                return await trigger(["name", "hasAgreedToTerms"]);
            case 2:
                return await trigger(["email", "additionalEmail", "phoneNumber"]);
            case 3:
                return await trigger(["password", "confirmPassword"]);
            case 4:
                return await trigger("university");
            case 5:
                return true;
            default:
                return true;
        }
    };

    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return !!(watchedValues.name && watchedValues.hasAgreedToTerms);
            case 2:
                return !!(
                    watchedValues.email &&
                    watchedValues.additionalEmail &&
                    watchedValues.phoneNumber &&
                    !errors.email &&
                    !errors.additionalEmail &&
                    !errors.phoneNumber
                );
            case 3:
                return !!(
                    watchedValues.password &&
                    watchedValues.confirmPassword &&
                    !errors.password &&
                    !errors.confirmPassword
                );
            case 4:
                return !!(
                    watchedValues.university &&
                    (watchedValues.university !== "Other (please specify)" ||
                        watchedValues.otherUniversity)
                );
            case 5:
                return true;
            default:
                return true;
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setValue("uploadedImage", file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const clearUploadedImage = () => {
        setValue("uploadedImage", null);
        setPreviewImage(null);
    };

    const onSubmit = async (data: SocietyRegisterFormData) => {
        const toastId = toast.loading("Creating your society's account...");

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
            const nameCheck = await fetch("/api/society/check-name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: data.name }),
            });
            const nameResult = await nameCheck.json();
            if (nameResult.nameTaken) {
                toast.dismiss(toastId);
                setErrorModal({
                    isOpen: true,
                    title: "Society Name Already Exists",
                    message:
                        "A society with this name already exists. Please choose a different name.",
                });
                return;
            }
        } catch (error) {
            toast.dismiss(toastId);
            setErrorModal({
                isOpen: true,
                title: "Connection Error",
                message:
                    "Unable to verify society name. Please check your connection and try again.",
            });
            return;
        }

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
                toast.dismiss(toastId);
                setErrorModal({
                    isOpen: true,
                    title: "Upload Error",
                    message: "Failed to upload logo. Please try again.",
                });
                return;
            }
        }

        try {
            const response = await fetch("/api/society/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Society account created successfully!", {
                    id: toastId,
                });
                setCurrentStep(totalSteps + 1);

                await fetch("/api/email/send-verification-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: data.email }),
                });
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
                    title="What's your society's name?"
                    subtitle="This will be displayed to students on the platform"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={nextStep}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    direction={direction}
                    onStepClick={handleStepClick}
                >
                    <div className="space-y-6">
                        <ModernInput
                            placeholder="e.g. KCL Lebanese Society"
                            error={errors.name?.message}
                            {...register("name", {
                                required: "Society name is required",
                            })}
                        />
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
                    title="Contact Information"
                    subtitle="Help us stay connected with your society"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={nextStep}
                    onBack={prevStep}
                    canContinue={canContinue()}
                    onStepClick={handleStepClick}
                    direction={direction}
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-gray-300 text-left block text-sm">
                                Society Email
                            </label>
                            <ModernInput
                                type="email"
                                placeholder="Enter your society's main email address"
                                error={errors.email?.message}
                                {...register("email", {
                                    required: "Society email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                            <p className="text-gray-400 text-xs">
                                This will be your login email and where we&apos;ll send important updates
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-gray-300 text-left block text-sm">
								Additional Email <i> (committee member or secondary society contact)</i>
                            </label>
                            <ModernInput
                                type="email"
                                placeholder="Enter a backup contact email"
                                error={errors.additionalEmail?.message}
                                {...register("additionalEmail", {
                                    required: "Additional email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-gray-300 text-left block text-sm">
                                Phone Number
                            </label>
                            <ModernInput
                                type="tel"
                                placeholder="Enter a contact phone number"
                                error={errors.phoneNumber?.message}
                                {...register("phoneNumber", {
                                    required: "Phone number is required",
                                    pattern: {
                                        value: /^[\+]?[1-9][\d]{0,15}$/,
                                        message: "Invalid phone number format",
                                    },
                                })}
                            />
                            <p className="text-gray-400 text-xs">
                                We&apos;ll use this to connect you with other society leaders
                            </p>
                        </div>
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
                                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
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
                    title="Which institution are you from?"
                    subtitle="This helps students find societies at their university"
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
                                placeholder="Enter your institution name"
                                error={errors.otherUniversity?.message}
                                {...register("otherUniversity", {
                                    required: "Please specify your institution",
                                })}
                            />
                        )}
                    </div>
                </ModernFormStep>
            )}

            {currentStep === 5 && (
                <ModernFormStep
                    key="step5"
                    title="Tell us about your society"
                    subtitle="This information helps students discover and connect with you"
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNext={handleSubmit(onSubmit)}
                    onBack={prevStep}
                    onStepClick={handleStepClick}
                    canContinue={canContinue()}
                    isLastStep={true}
                    direction={direction}
                >
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-gray-300 text-left block">
                                    Society Description (optional)
                                </label>
                                <textarea
                                    placeholder="e.g. We are a vibrant community celebrating Lebanese culture through social events, cultural nights, and networking opportunities. Join us to connect with fellow Lebanese students and explore our rich heritage together."
                                    rows={4}
                                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none"
                                    {...register("description")}
                                />
                            </div>
                            <ModernInput
                                placeholder="e.g. https://www.icradio.com"
                                error={errors.website?.message}
                                {...register("website")}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-gray-300 text-left block">
                                Tags (select up to 3)
                            </label>
                            <Controller
                                name="tags"
                                control={control}
                                render={({ field }) => (
                                    <ModernTagsSelect
                                        options={predefinedTags}
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
                                        placeholder="Select up to 3 tags for your society"
                                        maxTags={3}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-gray-300 text-left block">
                                Logo (optional)
                            </label>
                            <div className="flex flex-col items-center space-y-4">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="flex items-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20"
                                >
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    <span>Upload Logo</span>
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleImageUpload}
                                />

                                {previewImage && (
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="relative w-24 h-24 border border-white/20 rounded-xl overflow-hidden">
                                            <Image
                                                src={previewImage}
                                                alt="Society Logo Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearUploadedImage}
                                            className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors text-sm"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ModernFormStep>
            )}

            {currentStep === totalSteps + 1 && (
                <ModernFormStep
                    key="success"
                    title="Welcome to LSN!"
                    subtitle="Please check your email to verify your society's account"
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
                            Registration complete! Check your email for
                            verification.
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
