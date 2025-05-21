
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";
import NotificationView from "./notification-view";
import UpcomingEventsSection from "./events-section";
import { Suspense } from "react";
import Statistics from "./statistics";


export default async function HomePageTopSection() {

	return (

		<div className="flex flex-col bg-black bg-opacity-50">

			<NotificationView />
			<Title />
			<UpcomingEventsSection />
			<ForStudents />
			<ForSocieties />
			<ForSponsors />

		</div>

	)
}



function JoinButton({ text, className, href }: { text: string, className?: string, href: string }) {
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
				<p className="font-bold text-lg md:text-xl text-white">Connecting <i>500,000</i> students</p>
				<JoinButton href="/sign" text="Join us" />
				<Suspense fallback={<p className="text-white tracking-widest">Loading statistics...</p>}>
					<Statistics />
				</Suspense>
			</div>
		</section>
	)
}


function ForStudents() {
	return (
		<section className="flex flex-col items-start justify-center p-10 snap-start min-h-screen">
			<h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#feae14] to-[#a96601] ml-20 flex flex-row items-center">
				<span className="text-white mr-4">1. </span>For Students
			</h2>
			<p className="text-white text-xl md:text-3xl mt-20 mr-12 self-end">
				Every event, opportunity, group and skill all in one place. <br /><br />
				Become a student of the city.
			</p>
			<JoinButton href="/register/student" className="self-end mr-12 mt-12" text="Join the London Student Network" />
		</section>
	)
}

function ForSocieties() {
	return (
		<section className="flex flex-col items-start justify-center p-10 snap-start min-h-screen">
			<h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-bl from-[#079fbf] to-[#007289] mr-20 flex flex-row items-center self-end">
				<span className="text-white mr-4">2. </span>For Clubs and Societies
			</h2>
			<p className="text-white text-xl md:text-3xl mt-20 ml-12">
				Showcase your society to the city. <br /> <br />Student leaders work
				tirelessly to create exceptional events. Through LSN, every student
				in London can experience what you have to offer.
			</p>
			<JoinButton href="/register/society" className="ml-20 mt-12" text="Share your events through us today" />
		</section>
	)
}

function ForSponsors() {
	return (
		<section className="flex flex-col items-start justify-center min-h-screen p-10 snap-start">
			<h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#278876] bg-clip-text bg-gradient-to-br from-[#66f4b9] to-[#247f5e] ml-20 flex flex-row items-center">
				<span className="text-white mr-4">3. </span>For Sponsors
			</h2>
			<p className="text-white text-xl md:text-3xl mt-20 mr-12 self-end">
				We help organise events that reach the entire
				university student community across London. <br /> <br />
				Interested in sponsoring our exciting activities? Reach out today
				and be a part of something extraordinary.
			</p>
			<JoinButton href="/contact" className="self-end mr-12 mt-12" text="Contact our team" />
		</section>
	)
}