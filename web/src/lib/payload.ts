import cmsMediaMap from '../data/cms-media-map.json'

const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:3001'

type MediaMap = {
  sermons: Record<string, string>
  causes: Record<string, string>
  devotionals: Record<string, string>
  team?: Record<string, string>
  pillars?: Record<string, string>
}

const cmsImages = cmsMediaMap as MediaMap

type PayloadResponse<T> = {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
}

type PayloadGlobal<T> = T

export type Media = {
  id: string
  url?: string
  alt: string
  filename?: string
}

export type Sermon = {
  id: string
  title: string
  slug: string
  speaker: string
  content?: unknown
  videoUrl?: string
  audioUrl?: string
  thumbnail?: Media | string
  externalImageUrl?: string
  publishDate: string
}

export type Devotional = {
  id: string
  title: string
  slug: string
  type?: 'bulletin' | 'prayer' | 'devotional'
  content: unknown
  scriptureReference?: string
  thumbnail?: Media | string
  externalImageUrl?: string
  publishDate: string
}

export type Cause = {
  id: string
  title: string
  slug: string
  description: unknown
  image?: Media | string
  externalImageUrl?: string
  donationGoal: number
  currentRaised: number
}

export type HomepageBlock =
  | {
      blockType: 'hero'
      eyebrow?: string
      headline: string
      subheadline?: string
      backgroundImage?: Media | string
      primaryCta: { label: string; url: string }
      secondaryCta?: { label: string; url: string }
    }
  | {
      blockType: 'mediaGrid'
      title: string
      subtitle?: string
      items: Array<{
        image: Media | string
        title: string
        url?: string
        contentType: string
      }>
    }
  | {
      blockType: 'featuredSermons'
      title: string
      sermons: Sermon[]
    }
  | {
      blockType: 'featuredCauses'
      title: string
      causes: Cause[]
    }
  | {
      blockType: 'ctaBanner'
      headline: string
      body?: string
      buttonLabel: string
      buttonUrl: string
    }

export type Homepage = {
  layout: HomepageBlock[]
}

async function fetchPayload<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cf: { cacheTtl: 60, cacheEverything: true },
  } as RequestInit)

  if (!res.ok) {
    throw new Error(`Payload API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export function getMediaUrl(media: Media | string | undefined): string | undefined {
  if (!media) return undefined
  if (typeof media === 'string') return undefined
  if (media.url) return media.url.startsWith('http') ? media.url : `${CMS_URL}${media.url}`
  return undefined
}

export function getSermonImage(sermon: Sermon): string | undefined {
  return (
    getMediaUrl(typeof sermon.thumbnail === 'object' ? sermon.thumbnail : undefined) ||
    cmsImages.sermons[sermon.slug]
  )
}

/** Text-heavy sermon art (PNG) needs contain-fit; photos keep portrait cover crop. */
export function getSermonThumbVariant(imageUrl?: string | null): 'sermon' | 'graphic' {
  if (!imageUrl) return 'sermon'
  return /\.png$/i.test(imageUrl.split('?')[0] ?? '') ? 'graphic' : 'sermon'
}

export function getCauseImage(cause: Cause): string | undefined {
  return (
    getMediaUrl(typeof cause.image === 'object' ? cause.image : undefined) ||
    cmsImages.causes[cause.slug]
  )
}

export function getDevotionalImage(devotional: Devotional): string | undefined {
  return (
    getMediaUrl(typeof devotional.thumbnail === 'object' ? devotional.thumbnail : undefined) ||
    cmsImages.devotionals[devotional.slug]
  )
}

export async function getHomepage(): Promise<Homepage> {
  return fetchPayload<PayloadGlobal<Homepage>>('/globals/homepage?depth=2')
}

export async function getSermons(limit = 12): Promise<Sermon[]> {
  const data = await fetchPayload<PayloadResponse<Sermon>>(
    `/sermons?sort=-publishDate&limit=${limit}&depth=1`,
  )
  return data.docs
}

export async function getSermonBySlug(slug: string): Promise<Sermon | null> {
  const data = await fetchPayload<PayloadResponse<Sermon>>(
    `/sermons?where[slug][equals]=${slug}&limit=1&depth=1`,
  )
  return data.docs[0] ?? null
}

export async function getDevotionals(limit = 12): Promise<Devotional[]> {
  const data = await fetchPayload<PayloadResponse<Devotional>>(
    `/devotionals?sort=-publishDate&limit=${limit}&depth=1`,
  )
  return data.docs
}

export async function getDevotionalBySlug(slug: string): Promise<Devotional | null> {
  const data = await fetchPayload<PayloadResponse<Devotional>>(
    `/devotionals?where[slug][equals]=${slug}&limit=1&depth=1`,
  )
  return data.docs[0] ?? null
}

export async function getCauses(): Promise<Cause[]> {
  const data = await fetchPayload<PayloadResponse<Cause>>('/causes?sort=title&depth=1')
  return data.docs
}

export async function getCauseBySlug(slug: string): Promise<Cause | null> {
  const data = await fetchPayload<PayloadResponse<Cause>>(
    `/causes?where[slug][equals]=${slug}&limit=1&depth=1`,
  )
  return data.docs[0] ?? null
}
