import ProblemSection from '@/app/components/about-page/problem-section';
import SolutionSection from '@/app/components/about-page/solution-section';
import TeamSection from '@/app/components/about-page/team-section';
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'About London Student Network | Our Mission & Team',
    description: 'Want to find interesting events near you? Want more people to attend an event you have planned? Learn more about London Student Network - our motivation, solution, and team.',
};


export default function AboutPage() {
    return (
        <main className="relative bg-cover bg-center bg-fixed bg-no-repeat h-screen overflow-y-auto " style={{ backgroundImage: "url('/images/tower-bridge-1.jpeg')" }}>

            {/* Scrollable Content */}
            <div className="relative h-full overflow-y-auto bg-black bg-opacity-50 text-white snap-y snap-mandatory">
                <div className="p-10 space-y-10">
                    <section className='snap-start'>
                        <ProblemSection />
                    </section>
                    <section className='snap-start'>
                        <SolutionSection />
                    </section>
                    <section className='snap-start'>
                        <TeamSection />
                    </section>
                </div>
            </div>
        </main>
    );
}