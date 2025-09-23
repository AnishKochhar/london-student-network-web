"use client";

import { SocietyLogos, LondonUniversities } from "@/app/lib/utils";
import { VelocityScroll } from "../velocity-scroll";
import { AnimatedShinyText } from "@/app/components/animated-shiny-text";

export default function ScrollingPartnersSection() {
    const universities = LondonUniversities.filter(
        (uni) => uni !== "Other (please specify)",
    ).map((uni) => uni);
    const societies = SocietyLogos.map((soc) => soc.name);

    return (
        <section className="min-h-screen w-full bg-[#041A2E] flex flex-col items-center justify-center overflow-hidden snap-start py-20 space-y-16 max-w-full">
            <div className="w-full flex flex-col space-y-12">
                <AnimatedShinyText className="text-4xl md:text-6xl text-center font-bold tracking-[-0.02em]">
                    Our Societies
                </AnimatedShinyText>
                <VelocityScroll
                    items={societies}
                    default_velocity={0.2}
                    className="font-display text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-white md:leading-[5rem] gap-x-4 md:gap-x-8"
                />
                <div className="h-8" />
                <AnimatedShinyText className="text-4xl md:text-6xl text-center font-bold tracking-[-0.02em]">
                    Universities We&apos;re At
                </AnimatedShinyText>
                <VelocityScroll
                    items={universities}
                    default_velocity={-0.2}
                    className="font-display text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-white md:leading-[5rem] gap-x-4 md:gap-x-8"
                />
            </div>
        </section>
    );
}
