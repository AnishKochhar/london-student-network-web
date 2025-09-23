/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [{ hostname: "*.public.blob.vercel-storage.com" }],
		// Modern formats for better compression
		formats: ['image/webp', 'image/avif'],
		// Responsive image sizes for different breakpoints
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
		// Optimize image loading
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
	// Performance optimizations
	compress: true,
	poweredByHeader: false,
	generateEtags: true,

	// Security headers
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY'
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff'
					},
					{
						key: 'Referrer-Policy',
						value: 'origin-when-cross-origin'
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()'
					}
				]
			}
		];
	},

	// Optimize webpack bundle
	webpack: (config, { isServer }) => {
		// Optimize bundle splitting
		if (!isServer) {
			// Ensure the structure exists before setting properties
			if (!config.optimization) config.optimization = {};
			if (!config.optimization.splitChunks) config.optimization.splitChunks = {};
			if (!config.optimization.splitChunks.cacheGroups) config.optimization.splitChunks.cacheGroups = {};

			config.optimization.splitChunks.cacheGroups.commons = {
				name: 'commons',
				chunks: 'initial',
				minChunks: 2
			};
		}
		return config;
	},

	// Experimental features for better performance
	experimental: {
		gzipSize: true,
	}
};

export default nextConfig;
