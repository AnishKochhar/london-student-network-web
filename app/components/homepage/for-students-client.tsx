"use client"

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
				<span className="relative text-lg flex items-center space-x-2 text-white font-semibold capitalize tracking-wide">
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

const AnimatedText = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => {
	const ref = useRef<HTMLParagraphElement>(null)
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start 0.9", "start 0.25"],
	})

	const color = useTransform(scrollYProgress, [0, 1], ["rgb(107 114 128)", "rgb(255 255 255)"])

	return (
		<motion.p ref={ref} style={{ color }} className={className}>
			{children}
		</motion.p>
	)
}

export default function ForStudentsClient() {
	const sectionRef = useRef<HTMLElement>(null)
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"],
	})
	const x = useTransform(scrollYProgress, [0, 0.5], [-200, 0]) // Slides from left

	return (
		<section ref={sectionRef} className="flex flex-col items-start justify-center p-10 snap-start min-h-screen">
			<motion.h2
				style={{ x }}
				className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#feae14] to-[#a96601] ml-20 flex flex-row items-center"
			>
				<span className="text-white mr-4">1. </span>For Students
			</motion.h2>
			<AnimatedText className="text-white text-xl md:text-3xl mt-20 mr-12 self-end">
				Every event, opportunity, group and skill all in one place. <br />
				<br />
				Become a student of the city.
			</AnimatedText>
			<JoinButton href="/register/student" className="self-end mr-12 mt-12" text="Join the London Student Network" />
		</section>
	)
}
