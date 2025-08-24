import HomePageTopSection from "./components/homepage/top-section"
import ScrollingPartnersSection from "./components/homepage/scrolling-partners-section"

export default function Home() {
	return (
		<main
			className="relative bg-cover bg-center bg-no-repeat overflow-y-auto snap-y snap-mandatory"
			style={{ 
				backgroundImage: "url('/images/tower-bridge-1.jpeg')",
				backgroundAttachment: "fixed",
				backgroundSize: "cover",
				backgroundPosition: "center center"
			}}
		>
			<HomePageTopSection />
			<ScrollingPartnersSection />
		</main>
	)
}
