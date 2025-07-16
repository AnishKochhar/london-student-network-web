import Link from "next/link"
import clsx from "clsx"
import Image from "next/image"
import NotificationView from "./notification-view"
import UpcomingEventsSection from "./events-section"
import { Suspense } from "react"
import Statistics from "./statistics"
import ForStudentsClient from "./for-students-client"
import ForSocietiesClient from "./for-societies-client"
import ForSponsorsClient from "./for-sponsors-client"

export default function HomePageTopSection() {
	return (
		<div className="flex flex-col bg-black bg-opacity-50">
			<NotificationView />
			<Title />
			<UpcomingEventsSection />
			<ForStudentsClient />
			<ForSocietiesClient />
			<ForSponsorsClient />
		</div>
	)
}

function JoinButton({
	text,
	className,
	href,
}: {
	text: string
	className?: string
	href: string
}) {
	return (
		<Link href={href} className={clsx("flex items-center space-x-2 group", className)}>
			<div>
				<span className="relative text-lg flex items-center space-x-2 text-white font-semibold capitalize tracking-wide">
					{text}
					<Image
						src="/icons/arrow-right.svg"
						alt="next"
						width={20}
						height={12}
						className="h-4 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-2"
					/>
				</span>
				<span className="block w-full h-px bg-white mt-1"></span>
			</div>
		</Link>
	)
}

function Title() {
	return (
		<section className="flex flex-col items-center justify-center min-h-screen snap-start">
			<h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-bold uppercase tracking-widest ml-2 text-center">
				London Student Network
			</h1>
			<div className="w-auto flex flex-col p-10 space-y-8 items-center">
				<p className="font-bold text-lg md:text-xl text-white">
					Connecting <i>500,000</i> students
				</p>
				<JoinButton href="/sign" text="Join us" />
				<Suspense fallback={<p className="text-white tracking-widest">Loading statistics...</p>}>
					<Statistics />
				</Suspense>
			</div>
		</section>
	)
}
