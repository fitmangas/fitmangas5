import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/compte', '/api', '/auth', '/live', '/login', '/connexion'],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
