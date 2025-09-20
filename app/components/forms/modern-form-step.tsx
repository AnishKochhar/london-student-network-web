"use client";

import { motion } from "framer-motion";
import { ReactNode, KeyboardEvent } from "react";

interface ModernFormStepProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
    canContinue?: boolean;
    isLastStep?: boolean;
    direction?: "forward" | "backward";
    onStepClick?: (step: number) => void;
}

export default function ModernFormStep({
    title,
    subtitle,
    children,
    currentStep,
    totalSteps,
    onNext,
    onBack,
    canContinue = true,
    isLastStep = false,
    direction = "forward",
    onStepClick,
}: ModernFormStepProps) {
    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === "Enter" && canContinue) {
            e.preventDefault();
            onNext();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex flex-col items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{
                    opacity: 0,
                    x: direction === "forward" ? 100 : -100,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === "forward" ? -100 : 100 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto text-center space-y-6 sm:space-y-8"
                onKeyDown={handleKeyPress}
            >
                <div className="space-y-3 sm:space-y-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white px-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-base sm:text-lg text-gray-300 px-2">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="space-y-6">{children}</div>

                <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 pt-6 sm:pt-8">
                    <button
                        onClick={onBack}
                        className="px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all text-sm sm:text-base"
                    >
                        Back
                    </button>

                    <div className="flex space-x-1.5 sm:space-x-2 justify-center">
                        {Array.from({ length: totalSteps }).map((_, i) => {
                            const stepNumber = i + 1;
                            const isCompleted = stepNumber < currentStep;
                            const isCurrent = stepNumber === currentStep;
                            const isClickable = isCompleted && onStepClick;

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() =>
                                        isClickable
                                            ? onStepClick(stepNumber)
                                            : undefined
                                    }
                                    disabled={!isClickable}
                                    className={`rounded-full transition-all duration-300 ease-in-out ${
                                        isCurrent
                                            ? "w-6 sm:w-8 h-2 bg-white"
                                            : isCompleted
                                              ? "w-2 h-2 bg-blue-400 hover:bg-blue-300 cursor-pointer"
                                              : "w-2 h-2 bg-gray-600"
                                    } ${isClickable ? "hover:scale-110" : ""}`}
                                />
                            );
                        })}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={onNext}
                            disabled={!canContinue}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl transition-all text-sm sm:text-base"
                        >
                            {isLastStep ? "Submit" : "Continue"}
                        </button>
                        {!isLastStep && (
                            <span className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                                Press Enter ⏎
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
