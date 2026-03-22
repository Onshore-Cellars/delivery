import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://onshoredelivery.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/profile/', '/messages/', '/driver/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
