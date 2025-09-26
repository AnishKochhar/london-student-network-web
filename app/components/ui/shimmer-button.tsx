"use client";

import { cn } from "@/app/lib/utils";
import { ArrowRightIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ShimmerButtonProps {
    variant?: "register" | "registered" | "leave";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: "arrow" | "check" | "x";
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export function ShimmerButton({
    className,
    variant = "register",
    size = "md",
    loading = false,
    icon = "arrow",
    children,
    onClick,
    disabled,
    type = "button"
}: ShimmerButtonProps) {
    const sizeClasses = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base"
    };

    const variantClasses = {
        register: cn(
            "bg-zinc-900 text-white",
            "focus-visible:ring-blue-500"
        ),
        registered: cn(
            "bg-zinc-900 text-white",
            "focus-visible:ring-green-500"
        ),
        leave: cn(
            "bg-zinc-900 text-white",
            "focus-visible:ring-red-500"
        )
    };

    const gradientClasses = {
        register: "from-blue-500 via-indigo-500 to-purple-500",
        registered: "from-green-500 via-emerald-500 to-teal-500",
        leave: "from-red-500 via-pink-500 to-rose-500"
    };

    const IconComponent = {
        arrow: ArrowRightIcon,
        check: CheckIcon,
        x: XMarkIcon
    }[icon];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative overflow-hidden rounded-lg font-medium",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "flex items-center justify-center gap-2",
                "group",
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
        >
            {/* Gradient background effect - exactly like your inspiration */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r",
                    gradientClasses[variant],
                    "opacity-40 group-hover:opacity-80",
                    "blur transition-opacity duration-500"
                )}
            />

            {/* Shimmer flash effect */}
            <div
                className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100",
                    "bg-gradient-to-r from-transparent via-white/30 to-transparent",
                    "-skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%]",
                    "transition-all duration-700 ease-out"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2 z-10">
                <span className="text-white whitespace-nowrap">
                    {loading ? (
                        <span className="animate-pulse">
                            {children}
                        </span>
                    ) : (
                        children
                    )}
                </span>
                <IconComponent className="h-4 w-4 text-white/90 flex-shrink-0" />
            </div>
        </button>
    );
}