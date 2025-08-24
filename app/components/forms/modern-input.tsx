"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/app/lib/utils";

interface ModernInputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
	({ className, label, error, ...props }, ref) => {
		return (
			<div className="space-y-2">
				{label && (
					<label className="block text-sm font-medium text-gray-300">
						{label}
					</label>
				)}
				<input
					ref={ref}
					className={cn(
						"w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all",
						error && "border-red-400 focus:ring-red-400",
						className
					)}
					{...props}
				/>
				{error && (
					<p className="text-red-400 text-sm">{error}</p>
				)}
			</div>
		);
	}
);

ModernInput.displayName = "ModernInput";

export { ModernInput };