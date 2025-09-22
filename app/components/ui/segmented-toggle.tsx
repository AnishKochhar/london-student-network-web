"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

interface SegmentedToggleOption {
	label: string;
	value: string;
}

interface SegmentedToggleProps {
	options: SegmentedToggleOption[];
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
}

const SegmentedToggle = React.forwardRef<
	HTMLDivElement,
	SegmentedToggleProps
>(({ options, value, onValueChange, className }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"relative inline-flex h-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/70",
				className
			)}
		>
			{options.map((option, index) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onValueChange(option.value)}
					className={cn(
						"relative inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
						// First item
						index === 0 && "rounded-l-xl border-r border-white/20",
						// Middle items
						index > 0 && index < options.length - 1 && "border-r border-white/20",
						// Last item
						index === options.length - 1 && "rounded-r-xl",
						// Selected state
						value === option.value
							? "bg-white text-blue-900 shadow-lg shadow-black/10 z-10 font-semibold"
							: "hover:bg-white/15 hover:text-white"
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
});

SegmentedToggle.displayName = "SegmentedToggle";

export { SegmentedToggle, type SegmentedToggleOption };