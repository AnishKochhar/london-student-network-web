import { BASE_URL } from "@/app/lib/config";
import { WebsiteStats } from "@/app/lib/types";
import { FallbackStatistics } from "@/app/lib/utils";
import StatisticsClient from "./statistics-client";

const statisticsMap = [
	{
		text: "universities",
		json: "total_universities" as keyof WebsiteStats,
		description: "Universities represented in our network"
	},
	{
		text: "societies",
		json: "total_societies" as keyof WebsiteStats,
		description: "Active partner student societies across London"
	},
	{
		text: "events",
		json: "total_events" as keyof WebsiteStats,
		description: "Total events hosted on through LSN!"
	},
];

export default async function Statistics() {
	// console.log(process.env)
	let stats: WebsiteStats = FallbackStatistics;
	try {
		const res = await fetch(`${BASE_URL}/api/statistics`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: { revalidate: 3600 }, // Enable ISR (revalidate every 1 hour)
		});
		if (!res.ok) {
			throw new Error("Failed to fetch statistics");
		}
		stats = await res.json();
	} catch (error) {
		console.error("Error fetching data:", error);
	}

	// console.log("Parsed stats data:", JSON.stringify(stats, null, 2))

	return <StatisticsClient stats={stats} statisticsMap={statisticsMap} />;
}
