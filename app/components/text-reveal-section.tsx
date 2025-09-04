'use client';

import { FC, ReactNode, useRef, Fragment } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";

import { cn } from "@/app/lib/utils";

interface TextRevealSectionProps {
	texts: string[];
	className?: string;
	unrevealedTextColor?: string;
	revealedTextColor?: string;
}

const TextRevealSection: FC<TextRevealSectionProps> = ({
	texts,
	className,
	unrevealedTextColor = "text-black/20 dark:text-white/20",
	revealedTextColor = "text-white",
}) => {
	const targetRef = useRef<HTMLDivElement | null>(null);

	const { scrollYProgress } = useScroll({
		target: targetRef,
		offset: ["start 0.9", "start 0.25"],
	});

	const allWords = texts.flatMap(text => text.split(' '));
    let wordCounter = 0;

	return (
		<div ref={targetRef} className={cn("relative z-0 h-[50vh] flex items-center justify-center w-full max-w-[70%] md:max-w-[70%] sm:max-w-full", className)}>
			<div
				className={
					"flex flex-wrap p-5 text-black/20 dark:text-white/20 md:p-8 lg:p-10 text-center text-xl md:text-4xl"
				}
			>
				{texts.map((text, i) => (
                    <Fragment key={i}>
                        {text.split(' ').map((word, j) => {
                            const start = wordCounter / allWords.length;
                            const end = start + 1 / allWords.length;
                            wordCounter++;
                            return (
                                <Word key={j} progress={scrollYProgress} range={[start, end]} unrevealedTextColor={unrevealedTextColor} revealedTextColor={revealedTextColor}>
                                    {word}
                                </Word>
                            );
                        })}
                        {i < texts.length - 1 && <div className="basis-full h-8"></div>} 
                    </Fragment>
                ))}
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
