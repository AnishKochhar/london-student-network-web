import { CompanyInformation } from '@/app/lib/types';
import Image from 'next/image';;

export default async function SponsorsSection({companyInformation}:{companyInformation: CompanyInformation[]}) {
    const premiumSponsors = [
        {
            id: "0",
            company_name: "Sertie",
            contact_email: "", // not given
            contact_name: "Sertie", // not known, but set to company name as default
            description: "", // not given
            website: "https://sertie.io/",
            motivation: [""], // not given
            logo_url: '/sponsors/sertie.png'
        },
        {
            id: "0",
            company_name: "Forest",
            contact_email: "", // not given
            contact_name: "Forest", // not known, but set to company name as default
            description: "", // not given
            website: "https://forest.me/",
            motivation: [""], // not given
            logo_url: '/sponsors/forest.png'
        }
    ];

    // Combine premium sponsors with other sponsors
    const sortedSponsors: CompanyInformation[] = [
        ...premiumSponsors,
        ...companyInformation.filter(company => 
            !['Sertie', 'Forest', 'Traqr', 'TALAB', 'Association Of Azerbaijani British Professionals ', 'Talli Tigers'].includes(company.company_name)
        )
    ];

    console.log(sortedSponsors);

    const rows = Math.max(Math.min(companyInformation.length, 4), 2)
    return (
        <section
            className="relative w-full min-h-screen flex flex-col justify-center bg-center bg-cover bg-no-repeat pt-60 md:py-32"
        >
            {/* Overlay to make text readable */}
            <div className="absolute inset-0"></div>

            {/* Content */}
            <div className="relative z-10 text-centre text-white max-w-full mx-auto ">
                <h1 className="text-5xl font-bold mb-6 tracking-wider">Sponsors</h1>
                <hr className="border-white border-2 w-40 my-8" />

                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${rows} gap-6 mt-10`}>
                    {sortedSponsors.map((company, index) => (
                        <div key={index} className="bg-black bg-opacity-50 p-2 text-center">
                            <div className="w-48 h-60 relative mx-auto my-4">
                                <Image
                                    src={company.logo_url}
                                    alt={company.company_name}
                                    fill
                                    className='p-2'
                                    style={
                                        company.logoBgc ? {
                                            backgroundColor: company.logoBgc,
                                            objectFit: "contain"
                                        } : {objectFit: "contain"}
                                    }
                                />
                            </div>
                            {company.website? 
                                (<a
                                    className="text-2xl tracking-wider underline mb-2"
                                    target='_blank'
                                    href={company.website}
                                >
                                    {company.company_name}
                                </a>)
                            :
                                (<p className="text-2xl tracking-wider underline mb-2">
                                    {company.company_name}
                                </p>)
                            }

                            {company.website && 
                                <div
                                    className="relative flex w-full items-center text-left flex-row-reverse"
                                >
                                    {/* hero icons chevron left*/}
                                    {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg> */}
                                        <a
                                            href={company.website}
                                            className="relative flex flex-center text-xl tracking-wider mb-2 mt-5 h-full"
                                            target="_blank"
                                        >
                                            Click here
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                        </a>
                                </div>
                            }
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
