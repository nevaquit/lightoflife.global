const SCRIPTURE_PATTERN =
  /\b(?:[1-3]\s)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:-\d{1,3})?(?:\s*\([A-Z]+\))?/g

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&mdash;/g, '\u2014')
}

export function stripHtml(html: string): string {
  return decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractScripture(html: string): string | undefined {
  const text = stripHtml(html)
  const matches = text.match(SCRIPTURE_PATTERN)
  return matches?.[0]
}

export function sanitizeSlug(raw: string, fallback: string): string {
  try {
    const decoded = decodeURIComponent(raw)
    const cleaned = decoded
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96)
    return cleaned || fallback
  } catch {
    return fallback
  }
}

export function htmlToLexical(html: string) {
  const paragraphs = stripHtml(html)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    paragraphs.push(' ')
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
      })),
    },
  }
}

export type WpPost = {
  id: number
  date: string
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt?: { rendered: string }
  featured_media?: number
  _embedded?: {
    author?: Array<{ name: string }>
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>
  }
}

export function getFeaturedImageUrl(post: WpPost): string | undefined {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url
}

export function getAuthorName(post: WpPost): string {
  return post._embedded?.author?.[0]?.name || 'Rutendo Jenkins'
}

export async function fetchAllWpPosts(
  baseUrl: string,
  endpoint: string,
  perPage = 20,
): Promise<WpPost[]> {
  const results: WpPost[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const url = `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=${perPage}&page=${page}&_embed`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) {
        if (res.status === 400 && page > 1) break
        throw new Error(`WP API ${endpoint} page ${page}: ${res.status}`)
      }

      totalPages = Number(res.headers.get('X-WP-TotalPages') || 1)
      const batch = (await res.json()) as WpPost[]
      results.push(...batch)
      page++
    } catch (err) {
      clearTimeout(timeout)
      throw err
    }
  }

  return results
}
