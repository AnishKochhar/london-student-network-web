import Intro from '../components/sponsor-page/intro-section';
import SponsorSection from '@/app/components/sponsor-page/sponsor-section';
import HowToSponsorSection from '../components/sponsor-page/how-to-sponsor-section';
import { getAllCompanyInformation } from '../lib/data';
import { hardCodedSponsors } from '../components/sponsor-page/hard-coded-sponsors';

export default async function SponserPage() {
    const companyInformation = await getAllCompanyInformation();
    return (
        <main className="relative bg-cover bg-center bg-fixed bg-no-repeat h-screen overflow-y-auto snap-y snap-mandatory" style={{ backgroundImage: "url('/images/tower-bridge-1.jpeg')" }}>
            <div className="flex flex-col bg-black bg-opacity-50 text-white">
                <section className='p-10 snap-start min-h-screen flex items-center justify-center'>
                    <SponsorSection
                        companyInformation={[...companyInformation, ...hardCodedSponsors]}
                    />
                </section>

                <section className='flex flex-col items-start p-10 pl-[5%] snap-start min-h-screen justify-center'>
                    <Intro />
                </section>

                <section className='flex flex-col pb-10 pl-[10] pr-[5%] snap-start min-h-screen justify-center'>
                    <HowToSponsorSection />
                </section>
            </div>
        </main>
    );
}