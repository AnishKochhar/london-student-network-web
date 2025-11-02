import Image from "next/image";
import joshImage from "@/public/images/about/josh-robinson.png";
import anishImage from "@/public/images/about/anish-kochhar.jpg";
import zainImage from "@/public/images/about/zain-ahmad.png";
import amberImage from "@/public/images/about/amber-ella.jpeg";
import caspiaImage from "@/public/images/about/caspia-nadapdap.jpeg";
import nourImage from "@/public/images/about/nour-zalaquett.jpeg";
import daryusImage from "@/public/images/about/daryus-marchant.jpeg";
import mikaelImage from "@/public/images/about/mikhael-bashir.jpeg";
import hongleiImage from "@/public/images/about/honglei-gu.jpeg";
import gurvirImage from "@/public/images/about/gurvir-singh.jpeg";
import valeriaImage from "@/public/images/about/valeria-centola.jpeg";
import leyanImage from "@/public/images/about/leyan-jiang.jpeg";
import emilyImage from "@/public/images/about/emily-li.jpeg";
import scarlettImage from "@/public/images/about/scarlett-phillips.jpeg";

export default function TeamSection() {
    const teamMembers = [
        {
            name: "Josh Robinson",
            title: "Founder and CEO",
            image: joshImage,
        },
        {
            name: "Anish Kochhar",
            title: "Chief Technology Officer",
            image: anishImage,
        },
        {
            name: "Zain Ahmad",
            title: "Chief Strategy Officer",
            image: zainImage,
        },
		{
			name: "Nour Zalaquett",
			title: "Chief Partnerships Officer",
			image: nourImage,
		},
        {
            name: "Amber Ella",
            title: "Chief Operating Officer",
            image: amberImage,
        },
        {
            name: "Caspia Nadapdap",
            title: "Head of Events",
            image: caspiaImage,
        },

        {
            name: "Daryus Marchant",
            title: "Corporate Outreach Officer",
            image: daryusImage,
        },
        {
            name: "Mikael Bashir",
            title: "Senior Developer",
            image: mikaelImage,
        },
        {
            name: "Honglei Gu",
            title: "Web Developer",
            image: hongleiImage,
        },
        {
            name: "Gurvir Singh",
            title: "Web Developer",
            image: gurvirImage,
        },
        {
            name: "Valeria Centola",
            title: "Marketing Officer",
            image: valeriaImage,
        },
        {
            name: "Leyan Jiang",
            title: "Marketing Officer",
            image: leyanImage,
        },
        {
            name: "Emily Li",
            title: "Outreach Officer",
            image: emilyImage,
        },
        {
            name: "Scarlett Phillips",
            title: "Marketing Officer",
            image: scarlettImage,
        },
    ];

    return (
        <section className="relative w-full min-h-screen flex flex-col justify-center bg-center bg-cover bg-no-repeat pt-60 md:py-32">
            {/* Overlay to make text readable */}
            <div className="absolute inset-0"></div>

            {/* Content */}
            <div className="relative z-10 text-centre text-white max-w-full mx-auto ">
                <h1 className="text-5xl font-bold mb-6 tracking-wider">
                    Meet the Team
                </h1>
                <hr className="border-white border-2 w-40 my-8" />

                {/* Team Members */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            className="bg-black bg-opacity-50 p-2 text-center"
                        >
                            <div className="w-48 h-60 relative mx-auto my-4">
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
                                    style={{ objectFit: "contain" }}
                                />
                            </div>
                            <h2 className="text-2xl tracking-wider mb-2 underline">
                                {member.name}
                            </h2>
                            <p className="text-xl text-gray-300 pb-10">
                                {member.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
