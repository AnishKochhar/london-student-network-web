/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [{ hostname: "*.public.blob.vercel-storage.com" }],
		// Modern formats for better compression
		formats: ['image/webp', 'image/avif'],
		// Responsive image sizes for different breakpoints
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
	}
};

export default nextConfig;
