import HomePageTopSection from "./components/homepage/top-section";
import ScrollingPartnersSection from "./components/homepage/scrolling-partners-section";
import BackgroundImage from "./components/background-image";

export default function Home() {
    return (
        <>
            <BackgroundImage priority />
            <main className="relative">
                <HomePageTopSection />
                <ScrollingPartnersSection />
            </main>
        </>
    );
}
