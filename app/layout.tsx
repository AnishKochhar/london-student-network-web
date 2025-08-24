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
	// viewport: "width=device-width, initial-scale=1",
}

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
							<main className="flex-grow">{children}</main>
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
