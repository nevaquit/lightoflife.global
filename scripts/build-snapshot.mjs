/**
 * Standalone WordPress fetcher — no Payload dependencies required.
 * Usage: node scripts/build-snapshot.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const WP_BASE = process.env.WP_BASE_URL || 'https://lightoflife.global'

const SCRIPTURE = /\b(?:[1-3]\s)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:-\d{1,3})?/g

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '\u201C').replace(/&rdquo;/g, '\u201D').replace(/&mdash;/g, '\u2014')
}

function stripHtml(html) {
  return decode(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

function slugify(raw, fallback) {
  try {
    return decodeURIComponent(raw).toLowerCase().normalize('NFKD')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 96) || fallback
  } catch { return fallback }
}

function toLexical(html) {
  const paragraphs = stripHtml(html).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (!paragraphs.length) paragraphs.push(' ')
  return {
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
      })),
    },
  }
}

async function fetchAll(endpoint) {
  const results = []
  let page = 1, totalPages = 1
  while (page <= totalPages) {
    const url = `${WP_BASE}/wp-json/wp/v2/${endpoint}?per_page=20&page=${page}&_embed`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 45000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) { if (page > 1) break; throw new Error(`${endpoint} ${res.status}`) }
    totalPages = Number(res.headers.get('X-WP-TotalPages') || 1)
    results.push(...(await res.json()))
    page++
    process.stdout.write(`  ${endpoint} page ${page - 1}/${totalPages}\r`)
  }
  console.log(`  ${endpoint}: ${results.length} items`)
  return results
}

function transformSermon(p) {
  const html = p.content?.rendered || ''
  return {
    title: stripHtml(p.title.rendered),
    slug: slugify(p.slug, `sermon-${p.id}`),
    speaker: p._embedded?.author?.[0]?.name || 'Rutendo Jenkins',
    content: html.trim() ? toLexical(html) : undefined,
    scriptureReference: stripHtml(html).match(SCRIPTURE)?.[0],
    externalImageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    publishDate: p.date,
    legacyWordPressId: p.id,
  }
}

function transformDevotional(p, type) {
  const html = p.content?.rendered || ''
  return {
    title: stripHtml(p.title.rendered),
    slug: slugify(p.slug, `${type}-${p.id}`),
    type,
    content: toLexical(html),
    scriptureReference: stripHtml(html).match(SCRIPTURE)?.[0],
    publishDate: p.date,
    legacyWordPressId: p.id,
  }
}

function transformCause(p) {
  return {
    title: stripHtml(p.title.rendered),
    slug: slugify(p.slug, `cause-${p.id}`),
    description: toLexical(p.content?.rendered || ''),
    externalImageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    donationGoal: 0,
    currentRaised: 0,
    legacyWordPressId: p.id,
  }
}

console.log(`Fetching from ${WP_BASE}...`)
const [sermons, causes, posts, prayers] = await Promise.all([
  fetchAll('sermon'),
  fetchAll('causes'),
  fetchAll('posts'),
  fetchAll('prayers'),
])

const snapshot = {
  fetchedAt: new Date().toISOString(),
  source: WP_BASE,
  sermons: sermons.map(transformSermon),
  causes: causes.map(transformCause),
  devotionals: [
    ...posts.map((p) => transformDevotional(p, 'bulletin')),
    ...prayers.map((p) => transformDevotional(p, 'prayer')),
  ],
}

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.writeFileSync(path.join(DATA_DIR, 'snapshot.json'), JSON.stringify(snapshot, null, 2))
console.log(`\nSnapshot saved: ${snapshot.sermons.length} sermons, ${snapshot.causes.length} causes, ${snapshot.devotionals.length} devotionals`)
