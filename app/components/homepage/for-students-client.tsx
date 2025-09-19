"use client";

import { TextRevealSection } from "@/app/components/text-reveal-section";
import type React from "react";
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const JoinButton = ({
    text,
    className,
    href,
}: {
    text: string;
    className?: string;
    href: string;
}) => {
    return (
        <Link
            href={href}
            className={clsx("flex items-center space-x-2 group", className)}
        >
            <div>
                <span className="relative flex items-center space-x-2 text-white font-semibold capitalize tracking-wide">
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
    );
};

export default function ForStudentsClient() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });
    const x = useTransform(scrollYProgress, [0, 0.3], [-200, 0]); // Slides from left

    return (
        <section
            ref={sectionRef}
            className="flex flex-col items-start justify-center p-10 snap-start min-h-screen"
        >
            <motion.h2
                style={{ x }}
                className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#feae14] to-[#a96601] ml-20 flex flex-row items-center"
            >
                <span className="text-white mr-4">1. </span>For Students
            </motion.h2>
            <TextRevealSection
                texts={[
                    "Every event, opportunity, group and skill all in one place. Become a student of the city.",
                ]}
                className="text-white text-xl md:text-3xl mt-20 mr-12 self-start ml-20"
                unrevealedTextColor="text-white/20"
                revealedTextColor="text-white"
            />
            <JoinButton
                href="/register/student"
                className="self-start ml-20 mt-12 text-lg md:text-2xl px-6 md:px-8 py-3 md:py-4 rounded-lg"
                text="Join the London Student Network"
            />
        </section>
    );
}
