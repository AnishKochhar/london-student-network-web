/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://londonstudentnetwork.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/api/*',
    '/admin/*',
    '/private/*',
    '/account/*',
    '/sign',
    '/login',
    '/register/*',
    '/upload-image',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/account/',
          '/sign',
          '/login',
          '/register/',
          '/upload-image',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
    ],
    additionalSitemaps: [
      'https://londonstudentnetwork.com/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Custom priority and change frequency for different page types
    const customConfig = {
      loc: path,
      lastmod: new Date().toISOString(),
    };

    // Homepage - highest priority
    if (path === '/') {
      return {
        ...customConfig,
        changefreq: 'daily',
        priority: 1.0,
      };
    }

    // Main section pages - high priority
    if (['/events', '/societies', '/forum', '/jobs', '/sponsors'].includes(path)) {
      return {
        ...customConfig,
        changefreq: 'daily',
        priority: 0.9,
      };
    }

    // Info pages - medium priority
    if (['/about', '/contact', '/privacy', '/terms'].includes(path)) {
      return {
        ...customConfig,
        changefreq: 'monthly',
        priority: 0.6,
      };
    }

    // Dynamic event pages - high priority, frequent updates
    if (path.startsWith('/events/')) {
      return {
        ...customConfig,
        changefreq: 'weekly',
        priority: 0.8,
      };
    }

    // Society pages - medium-high priority
    if (path.startsWith('/societies/')) {
      return {
        ...customConfig,
        changefreq: 'weekly',
        priority: 0.7,
      };
    }

    // Forum pages - medium priority, frequent updates
    if (path.startsWith('/forum/')) {
      return {
        ...customConfig,
        changefreq: 'daily',
        priority: 0.6,
      };
    }

    // Default for other pages
    return {
      ...customConfig,
      changefreq: 'weekly',
      priority: 0.5,
    };
  },
  additionalPaths: async (config) => {
    const additionalPaths = [];

    try {
      // You can add dynamic paths here if needed
      // For example, fetching event IDs from your API

      // Example: Add specific important pages
      additionalPaths.push(
        await config.transform(config, '/events/create'),
        await config.transform(config, '/societies/partners'),
        await config.transform(config, '/register/student'),
        await config.transform(config, '/register/society'),
      );
    } catch (error) {
      console.error('Error generating additional sitemap paths:', error);
    }

    return additionalPaths;
  },
};