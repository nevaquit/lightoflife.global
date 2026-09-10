import type { WpPost } from './utils'
import {
  extractScripture,
  getAuthorName,
  getFeaturedImageUrl,
  htmlToLexical,
  sanitizeSlug,
  stripHtml,
} from './utils'

export type TransformedSermon = {
  title: string
  slug: string
  speaker: string
  content?: ReturnType<typeof htmlToLexical>
  scriptureReference?: string
  externalImageUrl?: string
  publishDate: string
  legacyWordPressId: number
}

export type TransformedDevotional = {
  title: string
  slug: string
  type: 'bulletin' | 'prayer' | 'devotional'
  content: ReturnType<typeof htmlToLexical>
  scriptureReference?: string
  publishDate: string
  legacyWordPressId: number
}

export type TransformedCause = {
  title: string
  slug: string
  description: ReturnType<typeof htmlToLexical>
  externalImageUrl?: string
  donationGoal: number
  currentRaised: number
  legacyWordPressId: number
}

export function transformSermon(post: WpPost): TransformedSermon {
  const title = stripHtml(post.title.rendered)
  const contentHtml = post.content.rendered
  const scripture = extractScripture(contentHtml)

  return {
    title,
    slug: sanitizeSlug(post.slug, `sermon-${post.id}`),
    speaker: getAuthorName(post),
    content: contentHtml.trim() ? htmlToLexical(contentHtml) : undefined,
    scriptureReference: scripture,
    externalImageUrl: getFeaturedImageUrl(post),
    publishDate: post.date,
    legacyWordPressId: post.id,
  }
}

export function transformPostToDevotional(post: WpPost): TransformedDevotional {
  const title = stripHtml(post.title.rendered)
  const contentHtml = post.content.rendered

  return {
    title,
    slug: sanitizeSlug(post.slug, `bulletin-${post.id}`),
    type: 'bulletin',
    content: htmlToLexical(contentHtml),
    scriptureReference: extractScripture(contentHtml),
    publishDate: post.date,
    legacyWordPressId: post.id,
  }
}

export function transformPrayerToDevotional(post: WpPost): TransformedDevotional {
  const title = stripHtml(post.title.rendered)
  const contentHtml = post.content.rendered

  return {
    title,
    slug: sanitizeSlug(post.slug, `prayer-${post.id}`),
    type: 'prayer',
    content: htmlToLexical(contentHtml),
    scriptureReference: extractScripture(contentHtml),
    publishDate: post.date,
    legacyWordPressId: post.id,
  }
}

export function transformCause(post: WpPost): TransformedCause {
  const title = stripHtml(post.title.rendered)

  return {
    title,
    slug: sanitizeSlug(post.slug, `cause-${post.id}`),
    description: htmlToLexical(post.content.rendered),
    externalImageUrl: getFeaturedImageUrl(post),
    donationGoal: 0,
    currentRaised: 0,
    legacyWordPressId: post.id,
  }
}

export function buildHomepageLayout(sermonIds: (string | number)[], causeIds: (string | number)[]) {
  return {
    layout: [
      {
        blockType: 'hero',
        eyebrow: 'One Light · One Truth · One Global Mission',
        headline: 'Illuminating the world with eternal truth',
        subheadline:
          '"I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life." — John 8:12 NIV',
        primaryCta: { label: 'Watch Sermons', url: '/sermons' },
        secondaryCta: { label: 'Join Us', url: '/contact' },
      },
      {
        blockType: 'mediaGrid',
        title: 'Ministry Pillars',
        subtitle: 'Weekly bulletins, sermons & podcast, and global outreach',
        items: [
          {
            title: 'Weekly Bulletins',
            url: '/devotionals',
            contentType: 'devotional',
          },
          {
            title: 'Sermons & Podcast',
            url: '/sermons',
            contentType: 'sermon',
          },
          {
            title: 'Global Outreach',
            url: '/causes',
            contentType: 'cause',
          },
        ],
      },
      ...(sermonIds.length
        ? [
            {
              blockType: 'featuredSermons',
              title: 'Latest Sermons',
              sermons: sermonIds.map((id) => Number(id)),
            },
          ]
        : []),
      ...(causeIds.length
        ? [
            {
              blockType: 'featuredCauses',
              title: 'Support Our Mission',
              causes: causeIds.map((id) => Number(id)),
            },
          ]
        : []),
      {
        blockType: 'ctaBanner',
        headline: 'Be the light in your community',
        body: 'Partner with Light of Life Global to reach nations with eternal truth.',
        buttonLabel: 'Support a Cause',
        buttonUrl: '/causes',
      },
    ],
  }
}
