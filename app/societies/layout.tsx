import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Student Societies in London",
    description: "Connect with student societies and organizations across London's universities. From academic societies to hobby groups, sports clubs to cultural organizations - find your community.",
    keywords: [
        "London student societies",
        "university societies London",
        "student organizations",
        "student clubs London",
        "university clubs",
        "student activities",
        "London university groups",
        "student communities"
    ],
    openGraph: {
        title: "Student Societies in London | London Student Network",
        description: "Connect with student societies and organizations across London's universities. Find your community among hundreds of student groups.",
        url: "https://londonstudentnetwork.com/societies",
        images: [
            {
                url: "/og-societies.jpg",
                width: 1200,
                height: 630,
                alt: "London Student Societies - Find Your Community",
            }
        ],
    },
    alternates: {
        canonical: "https://londonstudentnetwork.com/societies",
    },
};

export default function SocietiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}