/**
 * Fetches static pages + team from WordPress REST API into web/src/data/site-content.json
 * Usage: node scripts/build-site-content.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WP_BASE = process.env.WP_BASE_URL || 'https://lightoflife.global'
const OUT = path.join(__dirname, '../web/src/data/site-content.json')

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
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

function stripHtml(html) {
  return decode(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function htmlToSections(html) {
  const text = stripHtml(html)
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
}

function parseFaq(html) {
  const items = []
  const blocks = html.split(/<p><strong>/i).slice(1)
  for (const block of blocks) {
    const qMatch = block.match(/^(\d+\.\s*[^<]+)<\/strong><\/p>/i)
    if (!qMatch) continue
    const question = stripHtml(qMatch[1])
    const answerHtml = block.slice(qMatch[0].length)
    const answer = stripHtml(answerHtml)
    if (question && answer) items.push({ question, answer })
  }
  return items
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.json()
}

async function main() {
  const pageSlugs = ['about', 'faq', 'podcast', 'contact', 'ministry', 'prayer', 'staff']
  const pagesRaw = await fetchJson(
    `${WP_BASE}/wp-json/wp/v2/pages?slug=${pageSlugs.join(',')}&_fields=slug,title,content`,
  )
  const teamRaw = await fetchJson(`${WP_BASE}/wp-json/wp/v2/team?per_page=20&_embed`)

  const pages = {}
  for (const p of pagesRaw) {
    pages[p.slug] = {
      title: stripHtml(p.title.rendered),
      slug: p.slug,
      sections: htmlToSections(p.content.rendered),
      html: p.content.rendered,
    }
  }

  const podcastHtml = pages.podcast?.html || ''
  const iframeMatch = podcastHtml.match(/src="([^"]+buzzsprout[^"]+)"/i)
  const platformLinks = [...podcastHtml.matchAll(/href="(https?:\/\/[^"]+)"[^>]*>([^<]+)/gi)].map(
    (m) => ({ url: m[1], label: stripHtml(m[2]) }),
  )

  const team = teamRaw.map((t) => ({
    name: stripHtml(t.title.rendered),
    slug: t.slug,
    bio: stripHtml(t.content.rendered),
    imageUrl: t._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  }))

  const site = {
    fetchedAt: new Date().toISOString(),
    source: WP_BASE,
    navigation: [
      { label: 'Home', href: '/' },
      {
        label: 'About',
        href: '/about',
        children: [
          { label: 'Staff', href: '/staff' },
          { label: 'FAQ', href: '/faq' },
        ],
      },
      { label: 'Sermons', href: '/sermons' },
      { label: 'Blog', href: '/blog' },
      { label: 'Podcast', href: '/podcast' },
    ],
    footer: {
      tagline: 'One Light. One Truth. One Global Mission. Join our growing community.',
      aboutText:
        'Light of Life Global is an online ministry dedicated to spreading the transformative light of Christ through worship, teaching, and global outreach.',
      quickLinks: [
        { label: 'About Us', href: '/about' },
        { label: 'Sermons', href: '/sermons' },
        { label: 'Blog', href: '/blog' },
        { label: 'Podcast', href: '/podcast' },
        { label: 'Ministry', href: '/ministry' },
        { label: 'Prayers', href: '/prayers' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact Us', href: '/contact' },
      ],
      social: [
        { label: 'X (Twitter)', href: 'https://x.com/Lightoflifeonx' },
      ],
      newsletter: {
        title: 'Subscribe to Our Newsletter',
        description: 'Receive weekly bulletins, sermon updates, and ministry news.',
      },
    },
    pillarImages: {
      devotional: '',
      sermon: '',
      cause: '',
    },
    podcast: {
      title: 'Light Of Life with R.Jenkins',
      subtitle: 'Faith, purpose, and healing through biblical truth and honest conversation.',
      embedUrl: iframeMatch?.[1]?.replace(/&#038;/g, '&') || 'https://www.buzzsprout.com/2598948?client_source=large_player&iframe=true&player=large',
      platforms: platformLinks.filter((l) => /apple|spotify|amazon/i.test(l.url)),
    },
    faq: parseFaq(pages.faq?.html || ''),
    pages: {
      about: { title: pages.about?.title || 'About', sections: pages.about?.sections || [] },
      ministry: { title: pages.ministry?.title || 'Ministry', sections: pages.ministry?.sections || [] },
      contact: {
        title: pages.contact?.title || 'Contact',
        email: 'info@lightoflife.global',
      },
    },
    team,
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(site, null, 2))

  // Replace WordPress image URLs with self-hosted CMS media
  const { execSync } = await import('child_process')
  execSync('node scripts/apply-cms-media-to-site.mjs', { cwd: path.join(__dirname, '..'), stdio: 'inherit' })

  console.log(`Wrote ${OUT}`)
  console.log(`  ${team.length} team members, ${site.faq.length} FAQ items`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
