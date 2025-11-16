import { fetchHighlightedEvent } from "@/app/lib/data";
import HottestEventView from "./hottest-event-view";

const HIGHLIGHTED_EVENT_ID = "69c0c03f-ad49-49b0-9b09-51b02297bd1c";

// Custom appealing description for the hottest event
const HOTTEST_EVENT_DESCRIPTION = "Join us for The Giving Gala, an unforgettable black-tie evening of fundraising and connection hosted by Women in Politics Society and STAR KCL. Featuring the launch of The Clandestine magazine's first edition, keynote speakers, and networking with students, professionals, and leaders across the UK. All profits support refugee women rebuilding their lives in partnership with Refugee Women Connect. Don't miss one of London's most anticipated university charity events of the year!";

export default async function HottestEventSection() {
	// Homepage shows public events only - no session filtering needed
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
