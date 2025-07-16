"use client"

import type React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function AnimatedText({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
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
