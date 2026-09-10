import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type { GetPlatformProxyOptions } from 'wrangler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS_URL = process.env.PUBLIC_CMS_URL || 'https://lightoflife-cms.nevaquit.workers.dev'
const MAP_PATH = path.resolve(__dirname, '../../../../web/src/data/cms-media-map.json')

const STATIC_ASSETS = [
  {
    key: 'Rutendo.jpg',
    alt: 'Rutendo Jenkins',
    teamSlug: 'antony-doe',
    sourceUrl: 'https://lightoflife.global/wp-content/uploads/2016/08/Rutendo.jpg',
  },
  {
    key: 'HJ-Suit-pic.jpg',
    alt: 'Henry Jenkins',
    teamSlug: 'marilyn-doe',
    sourceUrl: 'https://lightoflife.global/wp-content/uploads/2016/08/HJ-Suit-pic.jpg',
  },
]

function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
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
  const existing = await bucket.head(key)
  if (existing) {
    return {
      size: existing.size,
      contentType: existing.httpMetadata?.contentType || mimeFromFilename(key),
    }
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || mimeFromFilename(key)
  await bucket.put(key, buffer, { httpMetadata: { contentType } })
  return { size: buffer.byteLength, contentType }
}

export async function syncStaticMedia() {
  const { env } = await getBindings()
  const bucket = env.R2 as R2Bucket
  const db = env.D1 as D1Database

  const maxRow = await db.prepare('SELECT MAX(id) as maxId FROM media').first<{ maxId: number }>()
  let nextId = (maxRow?.maxId ?? 0) + 1

  const team: Record<string, string> = {}

  for (const asset of STATIC_ASSETS) {
    const existing = await db
      .prepare('SELECT id, url FROM media WHERE filename = ?')
      .bind(asset.key)
      .first<{ id: number; url: string }>()

    let mediaUrl: string

    if (existing) {
      mediaUrl = existing.url
      console.log(`  · exists in D1: ${asset.key}`)
      await uploadToR2(bucket, asset.key, asset.sourceUrl)
    } else {
      const { size, contentType } = await uploadToR2(bucket, asset.key, asset.sourceUrl)
      const now = new Date().toISOString()
      mediaUrl = `/api/media/file/${asset.key}`

      await db
        .prepare(
          `INSERT INTO media (id, alt, updated_at, created_at, url, filename, mime_type, filesize)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(nextId, asset.alt, now, now, mediaUrl, asset.key, contentType, size)
        .run()

      nextId++
      console.log(`  ✓ uploaded: ${asset.key}`)
    }

    team[asset.teamSlug] = mediaUrl.startsWith('http') ? mediaUrl : `${CMS_URL}${mediaUrl}`
  }

  const map = fs.existsSync(MAP_PATH)
    ? (JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) as Record<string, unknown>)
    : { sermons: {}, causes: {}, devotionals: {} }

  const typedMap = map as {
    sermons: Record<string, string>
    causes: Record<string, string>
    devotionals: Record<string, string>
    team?: Record<string, string>
    pillars?: Record<string, string>
  }

  typedMap.team = { ...(typedMap.team || {}), ...team }
  typedMap.pillars = {
    devotional:
      typedMap.devotionals['raising-children-in-gods-light-protecting-the-next-generation-biblically'],
    sermon: typedMap.sermons['his-yoke-is-easy-and-his-burden-is-light'],
    cause: typedMap.causes['nourishing-bodies-nurturing-souls-a-meal-of-hope'],
  }

  fs.writeFileSync(MAP_PATH, JSON.stringify(typedMap, null, 2))
  console.log(`\nUpdated ${MAP_PATH} with ${Object.keys(team).length} team images`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  syncStaticMedia().catch((err) => {
    console.error('Static media sync failed:', err)
    process.exit(1)
  })
}
