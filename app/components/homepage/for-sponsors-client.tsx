"use client"

import { TextRevealSection } from "@/app/components/text-reveal-section";
import type React from "react"
import Link from "next/link"
import clsx from "clsx"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const JoinButton = ({
	text,
	className,
	href,
}: {
	text: string
	className?: string
	href: string
}) => {
	return (
		<Link href={href} className={clsx("flex items-center space-x-2 group", className)}>
			<div>
				<span className="relative  flex items-center space-x-2 text-white font-semibold capitalize tracking-wide">
					{text}
					<Image
						src="/icons/arrow-right.svg"
						alt="next"
						width={20}
						height={12}
						className="h-4 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-2"
					/>
				</span>
				<span className="block w-full h-px bg-white mt-1"></span>
			</div>
		</Link>
	)
}



export default function ForSponsorsClient() {
	const sectionRef = useRef<HTMLElement>(null)
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"],
	})
	const x = useTransform(scrollYProgress, [0, 0.3], [-200, 0]) // Slides from left

	return (
		<section ref={sectionRef} className="flex flex-col items-start justify-center min-h-screen p-10 snap-start">
			<motion.h2
				style={{ x }}
				className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#278876] bg-clip-text bg-gradient-to-br from-[#66f4b9] to-[#247f5e] ml-20 flex flex-row items-center"
			>
				<span className="text-white mr-4">3. </span>For Sponsors
			</motion.h2>
			<TextRevealSection
				text="We help organise events that reach the entire university student community across London. Interested in sponsoring our exciting activities? Reach out today and be a part of something extraordinary."
				className="text-white text-xl md:text-3xl mt-20 ml-12 self-start"
				unrevealedTextColor="text-white/20"
				revealedTextColor="text-white"
			/>
			<JoinButton href="/contact" className="self-start ml-20 mt-12 text-2xl px-8 py-4 rounded-lg" text="Contact our team" />
		</section>
	)
}
