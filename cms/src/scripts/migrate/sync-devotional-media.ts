import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type { GetPlatformProxyOptions } from 'wrangler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WP_IMAGES_PATH = path.resolve(__dirname, '../../../../web/src/data/wp-images.json')
const SNAPSHOT_PATH = path.resolve(__dirname, '../../../../scripts/data/snapshot.json')

type WpImages = {
  devotionals: Record<string, string>
}

type Snapshot = {
  devotionals: Array<{ slug: string; title: string }>
}

function basenameFromUrl(url: string): string {
  return path.basename(new URL(url).pathname)
}

function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  return map[ext] || 'application/octet-stream'
}

async function getBindings() {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: true,
      } satisfies GetPlatformProxyOptions),
  )
}

async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  url: string,
): Promise<{ size: number; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || mimeFromFilename(key)

  await bucket.put(key, buffer, {
    httpMetadata: { contentType },
  })

  return { size: buffer.byteLength, contentType }
}

export async function syncDevotionalMedia() {
  const wpImages = JSON.parse(fs.readFileSync(WP_IMAGES_PATH, 'utf8')) as WpImages
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as Snapshot
  const titleBySlug = new Map(snapshot.devotionals.map((d) => [d.slug, d.title]))

  const { env } = await getBindings()
  const bucket = env.R2 as R2Bucket
  const db = env.D1 as D1Database

  const devotionals = await db
    .prepare('SELECT id, slug, title, thumbnail_id FROM devotionals')
    .all<{ id: number; slug: string; title: string; thumbnail_id: number | null }>()

  const maxMedia = await db.prepare('SELECT MAX(id) as maxId FROM media').first<{ maxId: number }>()
  let nextMediaId = (maxMedia?.maxId ?? 0) + 1

  const usedFilenames = new Set<string>()
  const existingMedia = await db.prepare('SELECT filename FROM media').all<{ filename: string }>()
  for (const row of existingMedia.results ?? []) {
    if (row.filename) usedFilenames.add(row.filename)
  }

  let linked = 0

  for (const row of devotionals.results ?? []) {
    if (row.thumbnail_id) continue

    const sourceUrl = wpImages.devotionals[row.slug]
    if (!sourceUrl) {
      console.warn(`  ✗ no image URL for ${row.slug}`)
      continue
    }

    let filename = basenameFromUrl(sourceUrl)
    if (usedFilenames.has(filename)) {
      const ext = path.extname(filename)
      const base = path.basename(filename, ext)
      let i = 1
      while (usedFilenames.has(`${base}-${i}${ext}`)) i++
      filename = `${base}-${i}${ext}`
    }
    usedFilenames.add(filename)

    const alt = titleBySlug.get(row.slug) || row.title

    try {
      const { size, contentType } = await uploadToR2(bucket, filename, sourceUrl)
      const now = new Date().toISOString()
      const mediaUrl = `/api/media/file/${filename}`

      await db
        .prepare(
          `INSERT INTO media (id, alt, updated_at, created_at, url, filename, mime_type, filesize)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(nextMediaId, alt, now, now, mediaUrl, filename, contentType, size)
        .run()

      await db
        .prepare('UPDATE devotionals SET thumbnail_id = ?, updated_at = ? WHERE id = ?')
        .bind(nextMediaId, now, row.id)
        .run()

      console.log(`  ✓ devotional: ${row.slug} → ${filename}`)
      nextMediaId++
      linked++
    } catch (err) {
      console.warn(`  ✗ devotional failed (${row.slug}):`, err)
    }
  }

  console.log(`\nDevotional media sync: ${linked} linked`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  syncDevotionalMedia().catch((err) => {
    console.error('Devotional media sync failed:', err)
    process.exit(1)
  })
}
