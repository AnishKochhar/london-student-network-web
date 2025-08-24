'use client';

import { FC, ReactNode, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";

import { cn } from "@/app/lib/utils"; // Adjusted import path for cn

interface TextRevealSectionProps {
	text: string;
	className?: string;
	unrevealedTextColor?: string;
	revealedTextColor?: string;
}

const TextRevealSection: FC<TextRevealSectionProps> = ({
	text,
	className,
	unrevealedTextColor = "text-black/20 dark:text-white/20",
	revealedTextColor = "text-white",
}) => {
	const targetRef = useRef<HTMLDivElement | null>(null);

	const { scrollYProgress } = useScroll({
		target: targetRef,
		offset: ["start 0.9", "start 0.25"],
	});
	const segments = text.split(/(\n)/).filter(segment => segment !== '');
	const words = segments.flatMap(segment => 
		segment === '\n' ? [{ type: 'break' }] : segment.split(' ').map(word => ({ type: 'word', content: word }))
	);

	return (
		<div ref={targetRef} className={cn("relative z-0 h-[50vh] flex items-center justify-center w-full max-w-[70%] md:max-w-[70%] sm:max-w-full", className)}> {/* Full width on mobile */}
			<div
				className={
					"flex flex-wrap p-5 text-black/20 dark:text-white/20 md:p-8 lg:p-10 text-center text-xl md:text-4xl"
				} // Removed whitespace-pre-line since we're handling breaks manually
			>
				{words.map((item, i) => {
					if (item.type === 'break') {
						return <div key={i} className="w-full h-4" />;
					}
					
					const start = i / words.length;
					const end = start + 1 / words.length;
					return (
						<Word key={i} progress={scrollYProgress} range={[start, end]} unrevealedTextColor={unrevealedTextColor} revealedTextColor={revealedTextColor}>
							{item.content}
						</Word>
					);
				})}
			</div>
		</div>
	);
};

interface WordProps {
	children: ReactNode;
	progress: MotionValue<number>;
	range: [number, number];
	unrevealedTextColor?: string;
	revealedTextColor?: string;
}

const Word: FC<WordProps> = ({ children, progress, range, unrevealedTextColor, revealedTextColor }) => {
	const opacity = useTransform(progress, range, [0, 1]);
	return (
		<span className="xl:lg-3 relative mx-1 lg:mx-2.5">
			<span className={cn("absolute", unrevealedTextColor)}>{children}</span>
			<motion.span
				style={{ opacity: opacity }}
				className={cn(revealedTextColor)}
			>
				{children}
			</motion.span>
		</span>
	);
};

export { TextRevealSection };