"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/app/lib/utils";

interface ModernSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

const ModernSelect = forwardRef<HTMLSelectElement, ModernSelectProps>(
    (
        {
            className,
            label,
            error,
            options,
            placeholder = "Select an option",
            ...props
        },
        ref,
    ) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-gray-300">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={cn(
                        "w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all",
                        error && "border-red-400 focus:ring-red-400",
                        className,
                    )}
                    {...props}
                >
                    <option
                        value=""
                        disabled
                        className="bg-gray-800 text-gray-300"
                    >
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            className="bg-gray-800 text-white"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
        );
    },
);

ModernSelect.displayName = "ModernSelect";

export { ModernSelect };
