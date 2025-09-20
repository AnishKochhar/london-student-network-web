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
					x="-20%"
					y="-20%"
					width="140%"
					height="140%"
					colorInterpolationFilters="sRGB"
				>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.015 0.025"
						numOctaves="2"
						seed="2"
						result="turbulence"
					>
						<animate
							attributeName="baseFrequency"
							values="0.015 0.025;0.025 0.015;0.015 0.025"
							dur="8s"
							repeatCount="indefinite"
						/>
					</feTurbulence>
					<feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
					<feDisplacementMap
						in="SourceGraphic"
						in2="blurredNoise"
						scale="30"
						xChannelSelector="R"
						yChannelSelector="G"
						result="displaced"
					/>
					<feGaussianBlur in="displaced" stdDeviation="1.5" result="finalBlur" />
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
					{/* Enhanced glass morphism background */}
					<div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-white/[0.08] backdrop-blur-xl" />

					{/* Liquid glass effect layer with enhanced distortion */}
					<div
						className="absolute inset-0 rounded-full overflow-hidden"
						style={{
							backdropFilter: isHovered ? 'url("#liquid-glass") blur(4px)' : 'blur(12px)',
							transition: 'backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
						}}
					/>

					{/* Enhanced inner glass reflections */}
					<div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/[0.03] to-white/[0.08]" />

					{/* Additional glass layer for depth */}
					<div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-white/[0.04]" />

					{/* Enhanced inner shadow for more depth */}
					<div className="absolute inset-0 rounded-full shadow-[inset_0_3px_24px_rgba(255,255,255,0.08),inset_0_-3px_24px_rgba(0,0,0,0.15),inset_0_0_32px_rgba(255,255,255,0.02)]" />

					{/* Animated gold border ring with pulse - disabled for now */}
					{/* <div className="absolute inset-0 rounded-full animate-pulse"
						 style={{
							 boxShadow: '0 0 0 2px transparent, 0 0 0 3px rgba(251, 191, 36, 0.5), 0 0 8px rgba(253, 224, 71, 0.3)'
						 }} /> */}

					{/* Enhanced glass edge highlight */}
					<div className="absolute inset-0 rounded-full ring-1 ring-white/15 group-hover:ring-white/30 transition-all duration-400" />

					{/* Enhanced refraction effect */}
					<div className="absolute inset-[1px] rounded-full ring-1 ring-black/8 group-hover:ring-black/4 transition-all duration-400" />

					{/* Enhanced shine effect on hover - more prominent glass shine */}
					<div
						className="absolute inset-0 rounded-full transition-all duration-500 ease-out"
						style={{
							opacity: isHovered ? 1 : 0,
							background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
							transform: isHovered ? 'scale(1.02)' : 'scale(1)',
						}}
					/>

					{/* Additional subtle shimmer effect */}
					<div
						className="absolute inset-0 rounded-full transition-all duration-700 ease-in-out"
						style={{
							opacity: isHovered ? 0.4 : 0,
							background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
							transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
						}}
					/>

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