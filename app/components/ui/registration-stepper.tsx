"use client";

import { cn } from "@/app/lib/utils";
import { Check } from "lucide-react";

interface Step {
    number: number;
    label: string;
}

interface RegistrationStepperProps {
    currentStep: number;
    steps: Step[];
}

export default function RegistrationStepper({ currentStep, steps }: RegistrationStepperProps) {
    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.number;
                    const isCurrent = currentStep === step.number;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.number} className="flex items-center flex-1">
                            {/* Step circle */}
                            <div className="flex flex-col items-center relative">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 relative z-10",
                                        isCompleted && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30",
                                        isCurrent && "bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-2 border-blue-400 text-blue-600 backdrop-blur-xl",
                                        !isCompleted && !isCurrent && "bg-gray-100 border-2 border-gray-300 text-gray-400"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span>{step.number}</span>
                                    )}
                                </div>
                                {/* Step label */}
                                <div
                                    className={cn(
                                        "mt-2 text-xs font-medium text-center transition-colors duration-300 whitespace-nowrap",
                                        isCurrent && "text-blue-600",
                                        isCompleted && "text-gray-700",
                                        !isCompleted && !isCurrent && "text-gray-400"
                                    )}
                                >
                                    {step.label}
                                </div>
                            </div>

                            {/* Connector line */}
                            {!isLast && (
                                <div className="flex-1 h-0.5 mx-4 relative" style={{ marginTop: '-20px' }}>
                                    <div className="absolute inset-0 bg-gray-200" />
                                    <div
                                        className={cn(
                                            "absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out",
                                            isCompleted ? "scale-x-100" : "scale-x-0"
                                        )}
                                        style={{ transformOrigin: 'left' }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
