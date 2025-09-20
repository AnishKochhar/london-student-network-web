"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

const liquidButtonVariants = cva(
	"inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50",
	{
		variants: {
			variant: {
				default: "bg-transparent duration-300 transition text-white",
				primary: "bg-transparent duration-300 transition text-blue-300",
				destructive: "bg-transparent duration-300 transition text-red-300",
			},
			size: {
				default: "h-12 px-6 py-3",
				sm: "h-10 text-sm px-4 py-2",
				lg: "h-14 px-8 py-4 text-base",
				xl: "h-16 px-10 py-5 text-lg",
				icon: "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

function GlassFilter() {
	return (
		<svg className="hidden">
			<defs>
				<filter
					id="liquid-glass"
					x="0%"
					y="0%"
					width="100%"
					height="100%"
					colorInterpolationFilters="sRGB"
				>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.02 0.02"
						numOctaves="1"
						seed="1"
						result="turbulence"
					/>
					<feGaussianBlur in="turbulence" stdDeviation="1.5" result="blurredNoise" />
					<feDisplacementMap
						in="SourceGraphic"
						in2="blurredNoise"
						scale="50"
						xChannelSelector="R"
						yChannelSelector="B"
						result="displaced"
					/>
					<feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
					<feComposite in="finalBlur" in2="finalBlur" operator="over" />
				</filter>
			</defs>
		</svg>
	);
}

export interface LiquidButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
	VariantProps<typeof liquidButtonVariants> {
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
	({ className, variant, size, children, ...props }, ref) => {
		const [isHovered, setIsHovered] = React.useState(false);

		return (
			<>
				<button
					ref={ref}
					className={cn("relative group transform transition-transform duration-300", liquidButtonVariants({ variant, size, className }))}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
					{...props}
				>
					{/* Glass morphism background - more transparent */}
					<div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-white/[0.1] backdrop-blur-lg" />

					{/* Liquid glass effect layer */}
					<div
						className="absolute inset-0 rounded-full overflow-hidden"
						style={{
							backdropFilter: isHovered ? 'url("#liquid-glass")' : 'blur(8px)',
							transition: 'all 0.3s ease'
						}}
					/>

					{/* Inner glass reflections */}
					<div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/[0.03] to-white/[0.08]" />

					{/* Inner shadow for depth */}
					<div className="absolute inset-0 rounded-full shadow-[inset_0_2px_20px_rgba(255,255,255,0.05),inset_0_-2px_20px_rgba(0,0,0,0.1)]" />

					{/* Animated gold border with pulse */}
					<div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-amber-400/30 via-yellow-300/40 to-amber-400/30 animate-pulse blur-sm" />

					{/* Glass edge highlight */}
					<div className="absolute inset-0 rounded-full ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-300" />

					{/* Refraction effect */}
					<div className="absolute inset-[1px] rounded-full ring-1 ring-black/5" />

					{/* Shine effect on hover - diagonal glass shine */}
					<div className={cn(
						"absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700",
						"bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent",
						"bg-[length:200%_200%] bg-[position:-100%_-100%] group-hover:bg-[position:200%_200%] transition-[background-position] duration-1000"
					)} />

					{/* Content */}
					<div className="relative z-10 flex items-center justify-center gap-2">
						{children}
					</div>
				</button>
				<GlassFilter />
			</>
		);
	}
);

LiquidButton.displayName = "LiquidButton";

export { LiquidButton, liquidButtonVariants };