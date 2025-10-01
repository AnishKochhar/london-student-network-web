"use client";

import { useState } from "react";
import { WebsiteStats } from "@/app/lib/types";

interface StatisticItem {
	text: string;
	json: keyof WebsiteStats;
	description: string;
}

interface StatisticsClientProps {
	stats: WebsiteStats;
	statisticsMap: StatisticItem[];
}

export default function StatisticsClient({ stats, statisticsMap }: StatisticsClientProps) {
	const [hoveredDescription, setHoveredDescription] = useState<string | null>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const handleMouseEnter = (description: string) => {
		if (hoveredDescription && hoveredDescription !== description) {
			// Trigger exit animation before changing description
			setIsTransitioning(true);
			setTimeout(() => {
				setHoveredDescription(description);
				setIsTransitioning(false);
			}, 150);
		} else {
			setHoveredDescription(description);
		}
	};

	const handleMouseLeave = () => {
		setIsTransitioning(true);
		setTimeout(() => {
			setHoveredDescription(null);
			setIsTransitioning(false);
		}, 150);
	};

	return (
		<div className="font-bold text-lg md:text-xl text-white flex flex-col justify-center text-center">
			<div className="flex flex-col md:flex-row p-2 w-full items-center justify-evenly space-x-0 space-y-5 md:space-x-10 md:space-y-0">
				{statisticsMap.map(({ text, json, description }) => {
					const value = stats[json];
					return (
						<div
							key={text}
							className="flex flex-col items-center justify-center backdrop-blur text-white border-white border p-6 rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out w-40 cursor-pointer"
							onMouseEnter={() => handleMouseEnter(description)}
							onMouseLeave={handleMouseLeave}
						>
							<p className="text-3xl md:text-4xl font-bold">
								{value}
							</p>
							<p className="text-sm text-gray-300 uppercase">
								{text}
							</p>
						</div>
					);
				})}
			</div>

			{/* Shared description area */}
			<div className="mt-6 h-10 flex items-center justify-center overflow-hidden">
				<p
					className={`text-sm text-gray-300 transition-all duration-300 ease-in-out ${
						hoveredDescription && !isTransitioning
							? "opacity-100 translate-y-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
							: "opacity-0 -translate-y-2"
					}`}
				>
					{hoveredDescription || "\u00A0"}
				</p>
			</div>
		</div>
	);
}
