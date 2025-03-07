/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [{ hostname: "*.public.blob.vercel-storage.com" }]
	},
	api: {
		bodyParser: false, // Disable body parsing for API routes
	}
};

export default nextConfig;
