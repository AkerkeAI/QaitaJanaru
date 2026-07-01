import type { MetadataRoute } from 'next'

const baseUrl = 'https://qaita-janaru.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
