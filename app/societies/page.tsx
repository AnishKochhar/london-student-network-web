
export default function SocietyPage() {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
			<h1 className="text-5xl font-bold text-white mb-4 animate-pulse">
				Coming Soon
			</h1>
			<p className="text-lg text-gray-200 mb-8">
				We&#39;re working hard to bring you something amazing. Stay tuned for updates!
			</p>
			<div className="flex justify-center space-x-4">
				<a
					href="/"
					className="px-4 py-2  text-white font-semibold rounded-full shadow-lg hover:bg-indigo-600 transition duration-300"
				>
					Back to Home
				</a>
			</div>
		</main>
	);

}