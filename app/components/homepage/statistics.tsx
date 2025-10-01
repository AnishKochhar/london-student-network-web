import { fetchWebsiteStats } from "@/app/lib/data";
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
	let stats: WebsiteStats = FallbackStatistics;
	try {
		const result = await fetchWebsiteStats();
		stats = result as WebsiteStats;
	} catch (error) {
		console.error("Error fetching statistics:", error);
	}

	return <StatisticsClient stats={stats} statisticsMap={statisticsMap} />;
}
