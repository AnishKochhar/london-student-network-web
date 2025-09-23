import { AnimatedText } from "@/app/components/animated-text";
import NotificationView from "./notification-view";
import UpcomingEventsSection from "./events-section";
import { Suspense } from "react";
import Statistics from "./statistics";
import ForStudentsClient from "./for-students-client";
import ForSocietiesClient from "./for-societies-client";
import ForSponsorsClient from "./for-sponsors-client";
import JoinButton from "./join-button";

export default function HomePageTopSection() {
    return (
        <div className="flex flex-col bg-black bg-opacity-50 text-white overflow-x-hidden">
            <NotificationView />
            <Title />
            <UpcomingEventsSection />
            <ForStudentsClient />
            <ForSocietiesClient />
            <ForSponsorsClient />
        </div>
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
                <JoinButton href="/sign" text="Join Us" />
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
