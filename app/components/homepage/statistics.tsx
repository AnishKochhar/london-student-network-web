"use server";

import { BASE_URL } from "@/app/lib/config";
import { WebsiteStats } from "@/app/lib/types";
import { FallbackStatistics } from "@/app/lib/utils";

const statisticsMap = [
	{ text: 'universities', json: 'total_universities' },
	{ text: 'societies', json: 'total_societies' },
	{ text: 'events', json: 'total_events' },
]

export default async function Statistics() {
	// console.log(process.env)
	let stats: WebsiteStats = FallbackStatistics
	try {

		const res = await fetch(`${BASE_URL}/api/statistics`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			next: { revalidate: 86400 }, // Enable ISR (revalidate every 24 hours)
		});
		if (!res.ok) {
			throw new Error("Failed to fetch statistics");
		}
		stats = await res.json()

	} catch (error) {
		console.error("Error fetching data:", error)
	}
	// console.log(stats[0])
	if(Array.isArray(stats)) {
		// unsure why, but seems sometime the json is array-wrapped
		stats = stats[0]
	}
	console.log("Parsed stats data:", JSON.stringify(stats, null, 2))

	return (
		<div className="font-bold text-lg md:text-xl text-white flex flex-col justify-center text-center">
			{/* <h2 className="text-white text-md tracking-widest">OUR STATISTICS</h2> */}
			<div className="flex flex-col md:flex-row p-2 w-full items-center justify-evenly space-x-0 space-y-5 md:space-x-10 md:space-y-0">
				{statisticsMap.map(({ text, json }) => (
					<div
						key={text}
						className="flex flex-col items-center justify-center  backdrop-blur text-white border-white border p-6 rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out w-40"
					>
						<p className="text-3xl md:text-4xl font-bold">{stats[json]}</p>
						<p className="text-sm text-gray-300 uppercase">{text}</p>
					</div>
				))}
			</div>
		</div>
	)
}
