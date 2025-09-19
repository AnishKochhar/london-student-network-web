import { getAllCompanyInformation } from "../lib/data";
import { hardCodedSponsors } from "../components/sponsor-page/hard-coded-sponsors";
import SponsorsPageClient from "../components/sponsor-page/sponsors-client";
import { CompanyInformation } from "../lib/types";

export default async function SponsorsPage() {
    let allSponsors: CompanyInformation[] = [];
    try {
        const companyInformation = await getAllCompanyInformation();
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
