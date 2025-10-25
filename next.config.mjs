/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PERCENTAGE: process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '2.5',
	},
	images: {
		remotePatterns: [{ hostname: "*.public.blob.vercel-storage.com" }],
		// Modern formats for better compression
		formats: ['image/webp', 'image/avif'],
		// Responsive image sizes for different breakpoints
		deviceSizes: [640, 768, 1024, 1280, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
