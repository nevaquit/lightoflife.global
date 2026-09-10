import type { APIRoute } from 'astro'
import { absoluteUrl, PUBLIC_SITE_URL } from '../lib/config'
import { getCauses, getDevotionals, getSermons } from '../lib/payload'

export const prerender = false

export const GET: APIRoute = async () => {
  const staticPaths = [
    '/',
    '/about',
    '/ministry',
    '/sermons',
    '/devotionals',
    '/prayers',
    '/causes',
    '/podcast',
    '/blog',
    '/staff',
    '/faq',
    '/contact',
  ]

  let sermons: Awaited<ReturnType<typeof getSermons>> = []
  let devotionals: Awaited<ReturnType<typeof getDevotionals>> = []
  let causes: Awaited<ReturnType<typeof getCauses>> = []

  try {
    ;[sermons, devotionals, causes] = await Promise.all([
      getSermons(100),
      getDevotionals(100),
      getCauses(),
    ])
  } catch {
    // CMS may be briefly unavailable during deploy — still emit static URLs
  }

  const urls = [
    ...staticPaths.map((path) => ({
      loc: absoluteUrl(path),
      changefreq: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? '1.0' : '0.7',
    })),
    ...sermons.map((s) => ({
      loc: absoluteUrl(`/sermons/${s.slug}`),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    ...devotionals.map((d) => ({
      loc: absoluteUrl(`/devotionals/${d.slug}`),
      changefreq: 'weekly',
      priority: '0.7',
    })),
    ...causes.map((c) => ({
      loc: absoluteUrl(`/causes/${c.slug}`),
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Site-Origin': PUBLIC_SITE_URL,
    },
  })
}
