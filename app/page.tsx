import HomePageTopSection from "./components/homepage/top-section";
import ScrollingPartnersSection from "./components/homepage/scrolling-partners-section";
import BackgroundImage from "./components/background-image";
import { OrganizationStructuredData, WebsiteStructuredData } from "./components/seo/structured-data";

export const revalidate = 14400; // Revalidate every 4 hours

export default function Home() {
    return (
        <>
            <OrganizationStructuredData
                name="London Student Network"
                description="London's largest student community connecting over 500,000 students across all universities. Discover events, societies, jobs, and networking opportunities."
                url="https://londonstudentnetwork.com"
                logo="https://londonstudentnetwork.com/logo/LSN%20LOGO%201.png"
                sameAs={[
                    "https://twitter.com/londonstudentnet",
                    "https://instagram.com/londonstudentnetwork",
                    "https://linkedin.com/company/london-student-network"
                ]}
                contactPoint={{
                    contactType: "Customer Service",
                    email: "hello@londonstudentnetwork.com"
                }}
            />
            <WebsiteStructuredData
                name="London Student Network"
                description="Connecting students across London's universities"
                url="https://londonstudentnetwork.com"
                potentialAction={{
                    target: "https://londonstudentnetwork.com/events?search={search_term_string}",
                    queryInput: "required name=search_term_string"
                }}
            />
            <BackgroundImage priority />
            <main className="relative overflow-x-hidden">
                <HomePageTopSection />
                <ScrollingPartnersSection />
            </main>
        </>
    );
}
