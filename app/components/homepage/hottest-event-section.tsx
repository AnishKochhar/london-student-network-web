import { fetchActiveFeaturedEvent } from "@/app/lib/data";
import HottestEventView from "./hottest-event-view";

export default async function HottestEventSection() {
	// Fetch the dynamically configured featured event from the database
	const result = await fetchActiveFeaturedEvent();

	// If no featured event is configured or active, hide the section entirely
	if (!result) {
		return null;
	}

	const { event, customDescription } = result;

	// Use the custom description if set, otherwise use the event's original description
	const displayEvent = customDescription
		? { ...event, description: customDescription }
		: event;

	return (
		<section className="flex flex-col items-center justify-center min-h-screen snap-start p-10">
			<h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-center">
				Hottest Event
			</h2>
			<p className="text-gray-300 text-center mb-12 max-w-2xl">
				Don&apos;t miss the most anticipated event this week!
			</p>
			<HottestEventView event={displayEvent} />
		</section>
	);
}
