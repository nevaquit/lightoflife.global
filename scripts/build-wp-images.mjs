/**
 * Builds web/src/data/wp-images.json from snapshot + WordPress featured media.
 * Usage: node scripts/build-wp-images.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WP_BASE = process.env.WP_BASE_URL || 'https://lightoflife.global'
const SNAPSHOT = path.join(__dirname, 'data/snapshot.json')
const OUT = path.join(__dirname, '../web/src/data/wp-images.json')

async function fetchAll(endpoint) {
  const results = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await fetch(
      `${WP_BASE}/wp-json/wp/v2/${endpoint}?per_page=50&page=${page}&_embed`,
    )
    if (!res.ok) break
    totalPages = Number(res.headers.get('X-WP-TotalPages') || 1)
    results.push(...(await res.json()))
    page++
  }

  return results
}

function featuredUrl(post) {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
  const [posts, prayers] = await Promise.all([fetchAll('posts'), fetchAll('prayers')])

  const wpById = new Map()
  for (const post of [...posts, ...prayers]) {
    const url = featuredUrl(post)
    if (url) wpById.set(post.id, url)
  }

  const sermons = {}
  for (const item of snapshot.sermons) {
    if (item.externalImageUrl) sermons[item.slug] = item.externalImageUrl
  }

  const causes = {}
  for (const item of snapshot.causes) {
    if (item.externalImageUrl) causes[item.slug] = item.externalImageUrl
  }

  const devotionals = {}
  for (const item of snapshot.devotionals) {
    const url = wpById.get(item.legacyWordPressId)
    if (url) devotionals[item.slug] = url
  }

  const output = { sermons, causes, devotionals }
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2))
  console.log(
    `Wrote ${OUT}: ${Object.keys(sermons).length} sermons, ${Object.keys(causes).length} causes, ${Object.keys(devotionals).length} devotionals`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
