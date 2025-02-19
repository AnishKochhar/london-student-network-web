import PartnersSection from "./components/homepage/partners-section";
import HomePageTopSection from "./components/homepage/top-section";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "London Student Network",
	description: "For the students, by the students. The official London Student Network website.",
};

export default function Home() {
	return (
		<main className="relative bg-cover bg-center bg-fixed bg-no-repeat h-screen overflow-y-auto snap-y snap-mandatory" style={{ backgroundImage: "url('/images/tower-bridge-1.jpeg')" }} >

				<HomePageTopSection />
				<PartnersSection />
			
		</main>
	);
}
