import Image from "next/image";
import connectionIcon from "@/public/images/about/connection-icon.png";
import collaborationIcon from "@/public/images/about/collaboration-icon.png";
import careersIcon from "@/public/images/about/careers-icon.png";

export default function SolutionSection() {
    return (
        <section className="relative w-full min-h-screen flex flex-col justify-center bg-center bg-cover bg-no-repeat pt-60 md:pt-0">
            {/* Overlay to make text readable */}
            <div className="absolute inset-0"></div>

            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-6xl mx-auto">
                <h1 className="text-5xl text-left font-bold mb-6 tracking-wider">
                    Our Solution
                </h1>
                <hr className="border-white border-2 w-40 mt-8 mb-14" />

                {/* Grid layout for icons and descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {/* Connection Section */}
                    <div>
                        <Image
                            src={connectionIcon}
                            alt="Connection Icon"
                            className="bg-gray-500 rounded-full mx-auto mb-6 w-24 h-24"
                        />
                        <h2 className="text-3xl tracking-widest mb-10">
                            Connection.
                        </h2>
                        <p className="text-2xl font-light text-gray-300">
                            LSN is the first dedicated platform specifically
                            designed for sharing and promoting every event made
                            by a student for students across the city.
                        </p>
                    </div>

                    {/* Collaboration Section */}
                    <div>
                        <Image
                            src={collaborationIcon}
                            alt="Collaboration Icon"
                            className="bg-gray-500 rounded-full mx-auto mb-6 w-24 h-24"
                        />
                        <h2 className="text-3xl tracking-widest mb-10">
                            Collaboration.
                        </h2>
                        <p className="text-2xl font-light text-gray-300">
                            LSN acts as a hub to advertise your skills or to
                            offer opportunities to boost experience and success
                            across all societies.
                        </p>
                    </div>

                    {/* Careers Section */}
                    <div>
                        <Image
                            src={careersIcon}
                            alt="Careers Icon"
                            className="bg-gray-500 rounded-full mx-auto mb-6 w-24 h-24"
                        />
                        <h2 className="text-3xl tracking-widest mb-10">
                            Careers.
                        </h2>
                        <p className="text-2xl font-light text-gray-300">
                            LSN allows companies to reach people with known
                            preferences, ease the connection, and provide
                            resources for improving CV’s, interview skills, and
                            preparedness.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
