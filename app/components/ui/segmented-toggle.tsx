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
				// Mobile: vertical stack, Desktop: horizontal inline
				"relative flex flex-col sm:inline-flex sm:flex-row",
				"w-full sm:w-auto",
				"sm:h-11 items-center justify-center",
				"rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/70",
				className
			)}
		>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onValueChange(option.value)}
					className={cn(
						"relative flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
						// Mobile styles
						"w-full sm:w-auto",
						// Desktop: First item
						"sm:first:rounded-l-xl",
						// Desktop: Last item
						"sm:last:rounded-r-xl",
						// Desktop: Middle items and borders
						"sm:[&:not(:last-child)]:border-r sm:border-white/20",
						// Mobile: borders between items
						"[&:not(:last-child)]:border-b sm:border-b-0 border-white/20",
						// Mobile: rounded corners
						"first:rounded-t-xl sm:first:rounded-t-none",
						"last:rounded-b-xl sm:last:rounded-b-none",
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