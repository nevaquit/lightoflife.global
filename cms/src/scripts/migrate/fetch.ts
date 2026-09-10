import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { fetchAllWpPosts } from './utils'
import {
  buildHomepageLayout,
  transformCause,
  transformPostToDevotional,
  transformPrayerToDevotional,
  transformSermon,
} from './transform'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../../../scripts/data')
const WP_BASE = process.env.WP_BASE_URL || 'https://lightoflife.global'

export async function fetchWordPressSnapshot() {
  console.log(`Fetching WordPress content from ${WP_BASE}...`)

  const [sermons, causes, posts, prayers] = await Promise.all([
    fetchAllWpPosts(WP_BASE, 'sermon', 20),
    fetchAllWpPosts(WP_BASE, 'causes', 20),
    fetchAllWpPosts(WP_BASE, 'posts', 20),
    fetchAllWpPosts(WP_BASE, 'prayers', 20),
  ])

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    source: WP_BASE,
    sermons: sermons.map(transformSermon),
    causes: causes.map(transformCause),
    devotionals: [
      ...posts.map(transformPostToDevotional),
      ...prayers.map(transformPrayerToDevotional),
    ],
    homepage: buildHomepageLayout([], []),
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, 'snapshot.json'), JSON.stringify(snapshot, null, 2))

  console.log(`Saved snapshot:`)
  console.log(`  ${snapshot.sermons.length} sermons`)
  console.log(`  ${snapshot.causes.length} causes`)
  console.log(`  ${snapshot.devotionals.length} devotionals`)

  return snapshot
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  fetchWordPressSnapshot().catch((err) => {
    console.error('Fetch failed:', err)
    process.exit(1)
  })
}
