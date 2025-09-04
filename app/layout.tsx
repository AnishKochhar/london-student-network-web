import type React from "react"
import type { Metadata } from "next"
import { inria } from "@/app/fonts"
import "./globals.css"
import Header from "./components/header"
import Footer from "./components/footer"
import SessionProviderWrapper from "./components/session-provider-wrapper"
import { Toaster } from "react-hot-toast"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"

export const metadata: Metadata = {
	title: "London Student Network",
	description: "For the students, by the students",
}

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
}

// export const generateMetadata = ({ params }: { params?: { slug?: string } }): Metadata => {
// 	// Map static routes to "slugs"
// 	const staticRoutes: Record<string, string> = {
// 		'/account': 'account',
// 		'/events': 'events',
// 		'/about': 'about',
// 		'/contact': 'contact',
// 		'/societies': 'societies',
// 		'/': 'default',
// 	};

// 	// Get the slug (use static route mapping if params.slug is undefined)
// 	const slug = params?.slug || staticRoutes[globalThis?.location?.pathname] || 'default';

// 	// Metadata definitions
// 	const pageMetadata: Record<string, Metadata> = {
// 		account: {
// 			title: 'London Student Network | Manage Account Details',
// 			description: 'Manage your LSN account details, past events, and future events.',
// 		},
// 		events: {
// 			title: 'Upcoming Student Events in London | London Student Network',
// 			description: 'View popular upcoming events, hosted by students like you.',
// 		},
// 		about: {
// 			title: 'About London Student Network | Our Mission & Team',
// 			description: 'Learn more about London Student Network - our motivation, solution, and team.',
// 		},
// 		contact: {
// 			title: 'Contact London Student Network | Get in Touch',
// 			description: 'Get in touch with the LSN team. We are always happy to receive feedback or solve any issues.',
// 		},
// 		societies: {
// 			title: 'Find Student Societies in London | LSN',
// 			description: 'View all the societies hosting exciting events near you. Find out more or get in touch.',
// 		},
// 		default: {
// 			title: 'London Student Network | Student Events & Societies',
// 			description: 'For the students, by the students. The official London Student Network website.',
// 		},
// 	};

// 	return pageMetadata[slug] || pageMetadata.default;
// };


export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body className={`${inria.className} antialiased text-foreground bg-background`}>
				<SessionProviderWrapper>
					<Suspense fallback={<div>Loading...</div>}>
						<div className="flex flex-col min-h-screen">
							<Header />
							<div className="flex-grow">{children}</div>
							<Footer />
						</div>
					</Suspense>
					<Toaster position="top-right" />
					<Analytics />
				</SessionProviderWrapper>
			</body>
		</html>
	)
}
