import Image from 'next/image';

export default function TeamSection() {
    const teamMembers = [
        {
            name: "Josh Robinson",
            title: "Founder and CEO",
            image: "/images/about/josh-robinson.png",
        },
        {
            name: "Zain Ahmad",
            title: "Chief Strategy Officer",
            image: "/images/about/zain-ahmad.png",
        },
        {
            name: "Patrick Schnecker",
            title: "Head of Outreach",
            image: "/images/about/patrick-schnecker.png",
        },
        {
            name: "Manon Martin",
            title: "Head of Events",
            image: "/images/about/manon-martin.png",
        },
		{
			name: "Anish Kochhar",
			title: "Chief Technology Officer",
			image: "/images/about/anish-kochhar.jpg",
		},
        {
            name: "Nela Duniova",
            title: "Events Officer",
            image: "/images/about/nela-deniova.png",
        },
        {
            name: "Daryus Marchant",
            title: "Events Officer",
            image: "/images/about/daryus-marchant.png",
        },
        {
            name: "Julie Beaulieu",
            title: "Head of Marketing",
            image: "/images/about/julie-beaulieu.jpg",
        },
        {
            name: "Ollie Callon Hine",
            title: "Multimedia Officer",
            image: "/images/about/ollie-callon-hine.png",
        },
        {
            name: "Seddig Mohamed",
            title: "Multimedia Officer",
            image: "/images/about/seddig-mohamed.png",
        },
        {
            name: "Alan Jiang",
            title: "Web Developer",
            image: "/images/about/alan-jiang.jpg",
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
