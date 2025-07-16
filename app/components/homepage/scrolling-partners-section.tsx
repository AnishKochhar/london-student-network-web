import { SocietyLogos, SponsorsInformation, LondonUniversities } from "@/app/lib/utils"
import { cn } from "@/app/lib/utils"

const InfiniteScroller = ({
	items,
	direction = "left",
	speed = "slow",
}: {
	items: { name: string }[]
	direction?: "left" | "right"
	speed?: "slow" | "normal" | "fast"
}) => {
	return (
		<div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] group">
			<ul
				className={cn(
					"flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll group-hover:[animation-play-state:paused]",
					direction === "right" ? "animate-reverse" : "",
					speed === "fast" && "duration-[30s]",
					speed === "normal" && "duration-[60s]",
					speed === "slow" && "duration-[90s]",
				)}
			>
				{items.map((item, index) => (
					<li
						key={index}
						className="relative text-2xl md:text-3xl font-semibold whitespace-nowrap text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer p-2 rounded-lg group/item"
					>
						{item.name}
						<span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-yellow-400 scale-x-0 group-hover/item:scale-x-100 transition-transform duration-500 ease-out origin-center"></span>
					</li>
				))}
			</ul>
			<ul
				className={cn(
					"flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll group-hover:[animation-play-state:paused]",
					direction === "right" ? "animate-reverse" : "",
					speed === "fast" && "duration-[30s]",
					speed === "normal" && "duration-[60s]",
					speed === "slow" && "duration-[90s]",
				)}
				aria-hidden="true"
			>
				{items.map((item, index) => (
					<li
						key={index}
						className="relative text-2xl md:text-3xl font-semibold whitespace-nowrap text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer p-2 rounded-lg group/item"
					>
						{item.name}
						<span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-yellow-400 scale-x-0 group-hover/item:scale-x-100 transition-transform duration-500 ease-out origin-center"></span>
					</li>
				))}
			</ul>
		</div>
	)
}

export default function ScrollingPartnersSection() {
	const universities = LondonUniversities.filter((uni) => uni !== "Other (please specify)").map((uni) => ({
		name: uni,
	}))
	const societies = SocietyLogos.map((soc) => ({ name: soc.name }))

	return (
		<section className="min-h-screen w-full bg-[#041A2E] flex flex-col items-center justify-center overflow-hidden snap-start py-20 space-y-16">
			<h2 className="text-4xl md:text-6xl text-center font-bold text-white">Our Network</h2>
			<div className="w-full flex flex-col space-y-12">
				<InfiniteScroller items={societies} speed="normal" />
				<InfiniteScroller items={SponsorsInformation} direction="right" speed="fast" />
				<InfiniteScroller items={universities} speed="slow" />
			</div>
		</section>
	)
}
