"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface EventSearchBarProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}

export default function EventSearchBar({ searchQuery, setSearchQuery }: EventSearchBarProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className="mb-6"
		>
			<div className="relative max-w-2xl mx-auto">
				<div className="relative">
					<MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by title, organiser, or location..."
						className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
						>
							<XMarkIcon className="w-5 h-5" />
						</button>
					)}
				</div>
				{searchQuery && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="mt-2 text-center text-sm text-gray-400"
					>
						Searching for: <span className="text-white font-medium">&ldquo;{searchQuery}&rdquo;</span>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}