import ProblemSection from "@/app/components/about-page/problem-section";
import SolutionSection from "@/app/components/about-page/solution-section";
import TeamSection from "@/app/components/about-page/team-section";
import BackgroundImage from "../components/background-image";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "London Student Network is a student-built community connecting over 500,000 students across London's universities through events, societies, and opportunities.",
    alternates: { canonical: "/about" },
};

export default function AboutPage() {
    return (
        <main className="relative min-h-screen bg-black bg-opacity-50 text-white">
            <BackgroundImage />
            <div className="relative min-h-screen">
                <div className="p-10 space-y-10">
                    <section className="snap-start">
                        <ProblemSection />
                    </section>
                    <section className="snap-start">
                        <SolutionSection />
                    </section>
                    <section className="snap-start">
                        <TeamSection />
                    </section>
                </div>
            </div>
        </main>
    );
}
