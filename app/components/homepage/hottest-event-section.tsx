import { fetchHighlightedEvent } from "@/app/lib/data";
import HottestEventView from "./hottest-event-view";

const HIGHLIGHTED_EVENT_ID = "3af0dc9f-bdd4-4e7e-9695-d5e334ec5886";

// Custom appealing description for the hottest event
const HOTTEST_EVENT_DESCRIPTION = "KCL Neurotech presents their most anticipated academic talk of the year! Join Mr Jonathan Shapey, a clinical reader in neurosurgery and honorary consultant neurosurgeon, as he explores how cutting-edge neurotechnology is revolutionizing surgical outcomes. Slots are limited—register now for this groundbreaking session!";

export default async function HottestEventSection() {
	const event = await fetchHighlightedEvent(HIGHLIGHTED_EVENT_ID);

	if (!event) {
		return null;
	}

	// Override description with the appealing summary
	const eventWithCustomDescription = {
		...event,
		description: HOTTEST_EVENT_DESCRIPTION
	};

	return (
		<section className="flex flex-col items-center justify-center min-h-screen snap-start p-10">
			<h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-center">
				🔥 Hottest Event
			</h2>
			<p className="text-gray-300 text-center mb-12 max-w-2xl">
				Don&apos;t miss the most anticipated event this week!
			</p>
			<HottestEventView event={eventWithCustomDescription} />
		</section>
	);
}
