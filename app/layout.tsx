import type React from "react";
import type { Metadata } from "next";
import { inria } from "@/app/fonts";
import "./globals.css";
import Header from "./components/header";
import Footer from "./components/footer";
import SessionProviderWrapper from "./components/session-provider-wrapper";
import FloatingHelpButton from "./components/ui/floating-help-button";
import ConditionalShareFooter from "./components/account/conditional-share-footer";
import ConditionalReferralFooter from "./components/referral/conditional-referral-footer";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";

export const metadata: Metadata = {
    metadataBase: new URL('https://londonstudentnetwork.com'),
    title: {
        default: "London Student Network - Connecting 500,000+ Students",
        template: "%s | London Student Network"
    },
    description: "Join London's largest student community with 500,000+ members. Discover events, societies, jobs, and networking opportunities across all London universities. For the students, by the students.",
    keywords: [
        "London students",
        "student network",
        "university events",
        "London universities",
        "student societies",
        "student jobs",
        "networking",
        "student community",
        "university life London",
        "student opportunities"
    ],
    authors: [{ name: "London Student Network Team" }],
    creator: "London Student Network",
    publisher: "London Student Network",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        other: [
            { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
    },
    manifest: '/site.webmanifest',
    openGraph: {
        type: 'website',
        locale: 'en_GB',
        url: 'https://londonstudentnetwork.com',
        siteName: 'London Student Network',
        title: 'London Student Network - Connecting 500,000+ Students',
        description: 'Join London\'s largest student community with 500,000+ members. Discover events, societies, jobs, and networking opportunities across all London universities.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'London Student Network - Connecting Students Across London',
            }
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'London Student Network - Connecting 500,000+ Students',
        description: 'Join London\'s largest student community. Discover events, societies, jobs, and networking opportunities across all London universities.',
        images: ['/og-image.jpg'],
        creator: '@londonstudentnet',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://londonstudentnetwork.com',
    },
    category: 'education',
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inria.className} antialiased text-foreground bg-background`}
            >
                <SessionProviderWrapper>
                    <Suspense fallback={<div>Loading...</div>}>
                        <div className="flex flex-col min-h-screen">
                            <Header />
                            <div className="flex-grow">{children}</div>
                            <Footer />
                        </div>
                    </Suspense>
                    <FloatingHelpButton />
                    <ConditionalShareFooter />
                    <ConditionalReferralFooter />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                zIndex: 999999,
                            },
                        }}
                        containerStyle={{
                            zIndex: 999999,
                        }}
                    />
                    <Analytics />
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
