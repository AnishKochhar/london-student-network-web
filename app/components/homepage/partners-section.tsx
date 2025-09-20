"use client";

import SlidingPartners from "./sliding-partners";

export default function PartnersSection() {
    return (
        <section className="h-1/2 w-full bg-[#041A2E] flex flex-col items-center justify-start overflow-hidden snap-start">
            <h2 className="text-4xl md:text-6xl ml-28 w-full mt-12 mb-24 md:mb-28">
                Our Partners
            </h2>
            <SlidingPartners />
        </section>
    );
}
