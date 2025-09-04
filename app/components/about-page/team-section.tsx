import Image from 'next/image';

export default function TeamSection() {
    const teamMembers = [
        {
            name: "Josh Robinson",
            title: "Founder and CEO",
            image: "/images/about/josh-robinson.png",
        },
		{
			name: "Anish Kochhar",
			title: "Chief Technology Officer",
			image: "/images/about/anish-kochhar.jpg",
		},
        {
            name: "Zain Ahmad",
            title: "Chief Strategy Officer",
            image: "/images/about/zain-ahmad.png",
        },
		{
			name: "Amber Ella",
			title: "Chief Operating Officer",
			image: "/images/about/amber-ella.jpeg",
		},
		{
			name: "Caspia Nadapdap",
			title: "Head of Events",
			image: "/images/about/caspia-nadapdap.jpeg",
		},
		{
			name: "Nour Zalaquett",
			title: "Head of Outreach",
			image: "/images/about/nour-zalaquett.jpeg",
		},

		{
			name: "Daryus Marchant",
			title: "Corporate Outreach Officer",
			image: "/images/about/daryus-marchant.jpeg",
		},
		{
			name: "Mikael Bashir",
			title: "Senior Developer",
			image: "/images/about/mikhael-bashir.jpeg",
		},
		{
			name: "Honglei Gu",
			title: "Web Developer",
			image: "/images/about/honglei-gu.jpeg",
		},
		{
			name: "Gurvir Singh",
			title: "Web Developer",
			image: "/images/about/gurvir-singh.jpeg",
		},
		{
			name: "Valeria Centola",
			title: "Marketing Officer",
			image: "/images/about/valeria-centola.jpeg",
		},
		{
			name: "Leyan Jiang",
			title: "Marketing Officer",
			image: "/images/about/leyan-jiang.jpeg",
		},
        {
            name: "Emily Li",
            title: "Outreach Officer",
            image: "/images/about/emily-li.jpeg",
        },
		{
			name: "Scarlett Phillips",
			title: "Marketing Officer",
			image: "/images/about/scarlett-phillips.jpeg",
		},
    ];

    return (
        <section
            className="relative w-full min-h-screen flex flex-col justify-center bg-center bg-cover bg-no-repeat pt-60 md:py-32"
        >
            {/* Overlay to make text readable */}
            <div className="absolute inset-0"></div>

            {/* Content */}
            <div className="relative z-10 text-centre text-white max-w-full mx-auto ">
                <h1 className="text-5xl font-bold mb-6 tracking-wider">Meet the Team</h1>
                <hr className="border-white border-2 w-40 my-8" />

                {/* Team Members */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                    {teamMembers.map((member, index) => (
                        <div key={index} className="bg-black bg-opacity-50 p-2 text-center">
                            <div className="w-48 h-60 relative mx-auto my-4">
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
									style={{ objectFit: "contain" }}
                                />
                            </div>
                            <h2 className="text-2xl tracking-wider mb-2 underline">{member.name}</h2>
                            <p className="text-xl text-gray-300 pb-10">{member.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
