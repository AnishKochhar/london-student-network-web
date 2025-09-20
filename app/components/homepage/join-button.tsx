"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion } from "framer-motion";
import { LiquidButton } from "../ui/liquid-button";

export default function JoinButton({
	text,
	href,
}: {
	text: string;
	href: string;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.4 }}
		>
			<Link href={href}>
				<LiquidButton size="xl" className="font-bold text-lg group">
					<span>{text}</span>
					<motion.div
						className="ml-1"
						animate={{ x: 0 }}
						whileHover={{ x: 5 }}
						transition={{ duration: 0.2 }}
					>
						<ArrowRightIcon className="w-5 h-5" />
					</motion.div>
				</LiquidButton>
			</Link>
		</motion.div>
	);
}