// import { getAllCompanyInformation } from "../lib/data";
import { hardCodedSponsors } from "../components/sponsor-page/hard-coded-sponsors";
import SponsorsPageClient from "../components/sponsor-page/sponsors-client";
import { CompanyInformation } from "../lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sponsors & Partners",
    description:
        "Meet the organisations partnering with London Student Network to support students and societies across London's universities.",
    alternates: { canonical: "/sponsors" },
};

export default async function SponsorsPage() {
    let allSponsors: CompanyInformation[] = [];
    try {
        // const companyInformation = await getAllCompanyInformation();
		const companyInformation = [];
        const combinedSponsors = [...companyInformation, ...hardCodedSponsors];

        const uniqueSponsors = Array.from(
            new Map(
                combinedSponsors.map((sponsor) => [
                    sponsor.company_name,
                    sponsor,
                ]),
            ).values(),
        );
        allSponsors = uniqueSponsors;
    } catch (error) {
        console.error("Error fetching sponsors:", error);
        // Fallback to hardcoded sponsors if there is an error
        allSponsors = hardCodedSponsors;
    }

    return <SponsorsPageClient initialSponsors={allSponsors} />;
}
