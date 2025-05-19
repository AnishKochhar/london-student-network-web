export default function HowToSponsorSection() {
    return (
        <>
            {/* Content */}
            <h1 className="text-5xl font-bold ml-6 mb-6 self-end">How To Sponsor</h1>
            <p className="text-2xl leading-2 mb-4 text-right ml-10">
                Please 
                <a
                className="underline hover:font-bold m-2"
                href={"/contact"}
                >
                Contact Us
                </a>
                and we will get back to you as soon as possible.
            </p>
            <hr className="border-white border-2 w-40 my-8 self-end" />
            <h3 className="text-3xl font-bold mb-6 text-right ml-10">
                Our sincere thanks for trusting and supporting LSN.
            </h3>
        </>
    );
};
