export default function ProblemSection() {
    return (
        <section className="relative w-full min-h-screen flex flex-col justify-center ">
            {/* Overlay to make text readable */}
            <div className="absolute inset-0 "></div>

            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-6xl mx-auto">
                <h1 className="text-5xl text-left font-bold mb-6 tracking-wider">
                    Connecting London’s Students
                </h1>
                <hr className="border-white border-2 w-40 my-8" />
                <p className="text-3xl text-left leading-2 mb-4 tracking-widest">
                    Uniting diverse interests.
                    <br />
                    Showcasing talent.
                    <br />
                    Building careers.
                </p>
                <p className="text-2xl text-left font-light mb-8 mt-8 text-gray-300">
                    London&#39;s student community faces fragmentation and a
                    lack of representation.
                </p>
                <p className="text-2xl text-left font-light mb-8 text-gray-300">
                    Traditional organisations struggle to connect students
                    city-wide, leaving many feeling isolated and missing
                    opportunities. LSN aims to create a vibrant, interconnected
                    community that empowers individuals and fosters
                    collaboration across London.
                </p>
            </div>
        </section>
    );
}
