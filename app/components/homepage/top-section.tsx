import { AnimatedText } from "@/app/components/animated-text";
import { AnimatedShinyText } from "@/app/components/animated-shiny-text";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import clsx from "clsx";

import NotificationView from "./notification-view";
import UpcomingEventsSection from "./events-section";
import { Suspense } from "react";
import Statistics from "./statistics";

import ForStudentsClient from "./for-students-client";
import ForSocietiesClient from "./for-societies-client";
import ForSponsorsClient from "./for-sponsors-client";

export default function HomePageTopSection() {
    return (
        <div className="flex flex-col bg-black bg-opacity-50 text-white">
            <NotificationView />
            <Title />
            <UpcomingEventsSection />
            <ForStudentsClient />
            <ForSocietiesClient />
            <ForSponsorsClient />
        </div>
    );
}

function JoinButton({
    text,
    className,
    href,
}: {
    text: string;
    className?: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className={clsx(
                "group rounded-full border border-black/5 bg-white/10 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-white/20 dark:border-white/5 dark:bg-black/10 dark:hover:bg-black/20 underline",
                className,
            )}
        >
            <AnimatedShinyText className="inline-flex items-center justify-center px-6 py-2 text-xl transition ease-out underline">
                <span className="underline">{text}</span>
                <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5 underline" />
            </AnimatedShinyText>
        </Link>
    );
}

function Title() {
    return (
        <section className="flex flex-col items-center justify-center min-h-screen snap-start">
            <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-bold uppercase tracking-widest ml-2 text-center">
                London Student Network
            </h1>
            <div className="w-auto flex flex-col p-10 space-y-8 items-center">
                <AnimatedText
                    text="Connecting 500,000 students"
                    per="char"
                    className="font-bold text-lg md:text-xl text-white"
                />
                <JoinButton href="/sign" text="Join us" />
                <Suspense
                    fallback={
                        <p className="text-white tracking-widest">
                            Loading statistics...
                        </p>
                    }
                >
                    <Statistics />
                </Suspense>
            </div>
        </section>
    );
}
