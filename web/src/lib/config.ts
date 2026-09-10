/**
 * Site-wide URL and SEO defaults for Light of Life Global.
 * After DNS cutover, prefer https://lightoflife.global as the public origin.
 */
export const SITE_NAME = 'Light of Life Global'

export const PUBLIC_SITE_URL = (
  import.meta.env.PUBLIC_SITE_URL ||
  'https://lightoflife-web.pages.dev'
).replace(/\/$/, '')

export const PUBLIC_CMS_URL = (
  import.meta.env.PUBLIC_CMS_URL ||
  'https://lightoflife-cms.nevaquit.workers.dev'
).replace(/\/$/, '')

export const DEFAULT_DESCRIPTION =
  'Illuminating the world with eternal truth — sermons, devotionals, prayer, and global outreach from Light of Life Global.'

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${PUBLIC_SITE_URL}${normalized}`
}
