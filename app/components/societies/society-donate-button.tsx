'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface SocietyDonateButtonProps {
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'nav';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function SocietyDonateButton({
    onClick,
    variant = 'primary',
    size = 'md',
    className,
}: SocietyDonateButtonProps) {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]";

    const variantStyles = {
        primary: "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25",
        secondary: "bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-200",
        nav: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    };

    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm rounded-lg",
        md: "px-5 py-2.5 text-sm rounded-xl",
        lg: "px-6 py-3 text-base rounded-xl",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
        >
            <Heart className={cn(
                size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            )} />
            <span>Donate</span>
        </button>
    );
}
