"use client";

import { SocietyLogos, SponsorsInformation, LondonUniversities } from "@/app/lib/utils"
import { cn } from "@/app/lib/utils"
import { VelocityScroll } from "../velocity-scroll";
import { Announcement, AnnouncementTitle } from "../ui/announcement";
import { ArrowDownIcon } from "lucide-react";

export default function ScrollingPartnersSection() {
	const universities = LondonUniversities.filter((uni) => uni !== "Other (please specify)").map((uni) => uni);
	const societies = SocietyLogos.map((soc) => soc.name)

	return (
		<section className="min-h-screen w-full bg-[#041A2E] flex flex-col items-center justify-center overflow-hidden snap-start py-20 space-y-16">
			<h2 className="text-4xl md:text-6xl text-center font-bold text-white">Our Network</h2>
			<div className="w-full flex flex-col space-y-12">
				<Announcement className="mx-auto" themed>
					<AnnouncementTitle className="font-display text-center text-xl font-bold tracking-[-0.02em] text-white md:text-2xl">
						Our Societies
						<ArrowDownIcon size={16} className="shrink-0 text-muted-foreground" />
					</AnnouncementTitle>
				</Announcement>
				<VelocityScroll items={societies} default_velocity={0.2} className="font-display text-center text-4xl font-bold tracking-[-0.02em] text-white md:text-5xl md:leading-[5rem] pointer-events-auto gap-x-8" />
				<Announcement className="mx-auto" themed>
					<AnnouncementTitle className="font-display text-center text-xl font-bold tracking-[-0.02em] text-white md:text-2xl">
						Universities We're At
						<ArrowDownIcon size={16} className="shrink-0 text-muted-foreground" />
					</AnnouncementTitle>
				</Announcement>
				<VelocityScroll items={universities} default_velocity={-0.2} className="font-display text-center text-4xl font-bold tracking-[-0.02em] text-white md:text-5xl md:leading-[5rem] pointer-events-auto gap-x-8" />
			</div>
		</section>
	)
}
