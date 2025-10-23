"use client";

import { cn } from "@/app/lib/utils";
import { ArrowRightIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useRef } from "react";

interface GlassButtonProps {
    variant?: "register" | "registered" | "leave";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: "arrow" | "check" | "x" | "none";
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export function GlassButton({
    className,
    variant = "register",
    size = "md",
    loading = false,
    icon = "arrow",
    children,
    onClick,
    disabled,
    type = "button"
}: GlassButtonProps) {
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setMousePosition({ x, y });
    };

    const handleMouseLeave = () => {
        // Reset to center when mouse leaves
        setMousePosition({ x: 50, y: 50 });
    };
    const sizeClasses = {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base"
    };

    const variantClasses = {
        register: cn(
            "bg-gradient-to-br from-blue-500/20 to-indigo-600/20",
            "border-blue-400/30 hover:border-blue-400/50",
            "text-gray-900",
            "shadow-[0_8px_32px_0_rgba(59,130,246,0.15)]",
            "hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.25)]"
        ),
        registered: cn(
            "bg-gradient-to-br from-green-500/30 to-emerald-600/30",
            "border-green-400/40 hover:border-green-400/60",
            "text-gray-900",
            "shadow-[0_8px_32px_0_rgba(34,197,94,0.2)]",
            "hover:shadow-[0_8px_32px_0_rgba(34,197,94,0.35)]"
        ),
        leave: cn(
            "bg-gradient-to-br from-red-500/20 to-rose-600/20",
            "border-red-400/30 hover:border-red-400/50",
            "text-gray-900",
            "shadow-[0_8px_32px_0_rgba(239,68,68,0.15)]",
            "hover:shadow-[0_8px_32px_0_rgba(239,68,68,0.25)]"
        )
    };

    const getSpotlightGradient = (variant: "register" | "registered" | "leave", x: number, y: number) => {
        const gradients = {
            register: `radial-gradient(circle at ${x}% ${y}%, rgba(59, 130, 246, 0.5) 0%, rgba(99, 102, 241, 0.3) 25%, transparent 60%)`,
            registered: `radial-gradient(circle at ${x}% ${y}%, rgba(34, 197, 94, 0.5) 0%, rgba(16, 185, 129, 0.3) 25%, transparent 60%)`,
            leave: `radial-gradient(circle at ${x}% ${y}%, rgba(239, 68, 68, 0.5) 0%, rgba(244, 63, 94, 0.3) 25%, transparent 60%)`
        };
        return gradients[variant];
    };

    const IconComponent = icon !== "none" ? {
        arrow: ArrowRightIcon,
        check: CheckIcon,
        x: XMarkIcon
    }[icon] : null;

    return (
        <button
            ref={buttonRef}
            type={type}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            disabled={disabled || loading}
            className={cn(
                "relative overflow-hidden rounded-xl font-semibold",
                "border backdrop-blur-xl",
                "transition-all duration-300 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
                "disabled:pointer-events-none disabled:opacity-50",
                "flex items-center justify-center gap-2.5",
                "group",
                "transform hover:scale-[1.02] active:scale-[0.98]",
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
        >
            {/* Spotlight glow effect - follows cursor position */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl",
                    "opacity-0 group-hover:opacity-100",
                    "transition-all duration-300 ease-out",
                    "pointer-events-none"
                )}
                style={{
                    background: getSpotlightGradient(variant, mousePosition.x, mousePosition.y),
                    transition: 'background 0.3s ease-out, opacity 0.3s ease-out'
                }}
            />

            {/* Glass reflection effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-br from-white/10 via-transparent to-transparent",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-300"
                )}
            />

            {/* Shimmer effect */}
            <div
                className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100",
                    "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                    "-skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%]",
                    "transition-all duration-1000 ease-out"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2.5 z-10">
                {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
                <span className="font-semibold whitespace-nowrap drop-shadow-sm">
                    {children}
                </span>
                {!loading && IconComponent && (
                    <IconComponent className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                )}
            </div>

            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 to-transparent" />
            </div>
        </button>
    );
}
