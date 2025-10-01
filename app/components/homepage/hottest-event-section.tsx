import { fetchHighlightedEvent } from "@/app/lib/data";
import HottestEventView from "./hottest-event-view";

const HIGHLIGHTED_EVENT_ID = "40075001-c83a-4c09-b0ef-382894e4134d";

export default async function HottestEventSection() {
	const event = await fetchHighlightedEvent(HIGHLIGHTED_EVENT_ID);

	if (!event) {
		return null;
	}

	return (
		<section className="flex flex-col items-center justify-center min-h-screen snap-start p-10">
			<h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-center">
				🔥 Hottest Event
			</h2>
			<p className="text-gray-300 text-center mb-12 max-w-2xl">
				Don&apos;t miss the most anticipated event this week!
			</p>
			<HottestEventView event={event} />
		</section>
	);
}
