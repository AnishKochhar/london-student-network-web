export default function ThankYouPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
            <h1 className="text-4xl font-semibold text-center text-white mb-10">
                Thank You!
            </h1>

            <div className="bg-transparent p-6 rounded-lg w-full sm:w-96 text-center">
                <p className="text-xl text-white">
                    Your message has been sent successfully!
                </p>
                <p className="mt-4 text-gray-300">
                    We will get back to you shortly.
                </p>
            </div>
        </main>
    );
}
