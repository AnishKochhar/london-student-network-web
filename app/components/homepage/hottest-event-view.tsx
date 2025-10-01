"use client";

import { Event } from "@/app/lib/types";
import { formatEventDateTime } from "@/app/lib/utils";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import Link from "next/link";

interface HottestEventViewProps {
	event: Event;
}

export default function HottestEventView({ event }: HottestEventViewProps) {
	const eventUrl = `/events/${base16ToBase62(event.id)}`;

	return (
		<Link href={eventUrl} className="block max-w-4xl w-full px-4 sm:px-0 group">
			<div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-1 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02]">
				<div className="bg-[#041A2E] rounded-lg sm:rounded-xl p-5 sm:p-8 md:p-12 h-full">
					{/* Fire badge */}
					<div className="inline-flex items-center gap-1.5 sm:gap-2 bg-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6 animate-pulse">
						<span className="text-base sm:text-xl">🔥</span>
						<span className="whitespace-nowrap">HOTTEST EVENT</span>
					</div>

					<h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 group-hover:text-orange-300 transition-colors leading-tight">
						{event.title}
					</h3>

					<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 text-gray-300 text-sm sm:text-base">
						<div className="flex items-center gap-2">
							<span className="text-lg sm:text-xl">📅</span>
							<span className="font-medium">{formatEventDateTime(event)}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-lg sm:text-xl">📍</span>
							<span className="font-medium truncate">{event.location_building}</span>
						</div>
					</div>

					<p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6 line-clamp-3">
						{event.description}
					</p>

					<div className="flex items-center gap-2 sm:gap-3 text-orange-400 font-semibold text-sm sm:text-base group-hover:gap-4 sm:group-hover:gap-5 transition-all">
						<span>View Event Details</span>
						<span className="text-xl sm:text-2xl group-hover:translate-x-2 transition-transform">→</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
