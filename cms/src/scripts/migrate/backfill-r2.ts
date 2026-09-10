import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { getPayload } from 'payload'

import config from '../../payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WP_IMAGES_PATH = path.resolve(__dirname, '../../../../web/src/data/wp-images.json')
const SNAPSHOT_PATH = path.resolve(__dirname, '../../../../scripts/data/snapshot.json')

type WpImages = {
  sermons: Record<string, string>
  causes: Record<string, string>
  devotionals: Record<string, string>
}

type Snapshot = {
  sermons: Array<{ slug: string; externalImageUrl?: string; title: string }>
  causes: Array<{ slug: string; externalImageUrl?: string; title: string }>
  devotionals: Array<{ slug: string; title: string; legacyWordPressId?: number }>
}

function basenameFromUrl(url: string): string {
  return path.basename(new URL(url).pathname)
}

function buildSourceMaps() {
  const byBasename = new Map<string, string>()
  const byTitle = new Map<string, string>()

  const wpImages = JSON.parse(fs.readFileSync(WP_IMAGES_PATH, 'utf8')) as WpImages
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as Snapshot

  const addUrl = (url: string, title?: string) => {
    byBasename.set(basenameFromUrl(url), url)
    if (title) byTitle.set(title.toLowerCase().trim(), url)
  }

  for (const [slug, url] of Object.entries(wpImages.sermons)) {
    const item = snapshot.sermons.find((s) => s.slug === slug)
    addUrl(url, item?.title)
  }
  for (const [slug, url] of Object.entries(wpImages.causes)) {
    const item = snapshot.causes.find((c) => c.slug === slug)
    addUrl(url, item?.title)
  }
  for (const [slug, url] of Object.entries(wpImages.devotionals)) {
    const item = snapshot.devotionals.find((d) => d.slug === slug)
    addUrl(url, item?.title)
  }

  for (const item of [...snapshot.sermons, ...snapshot.causes]) {
    if (item.externalImageUrl) addUrl(item.externalImageUrl, item.title)
  }

  return { byBasename, byTitle }
}

function resolveSourceUrl(
  filename: string,
  alt: string | undefined,
  maps: ReturnType<typeof buildSourceMaps>,
): string | undefined {
  return (
    maps.byBasename.get(filename) ||
    (alt ? maps.byTitle.get(alt.toLowerCase().trim()) : undefined)
  )
}

async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  url: string,
): Promise<boolean> {
  const existing = await bucket.head(key)
  if (existing) return false

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'application/octet-stream'

  await bucket.put(key, buffer, {
    httpMetadata: { contentType },
  })

  return true
}

export async function backfillR2() {
  const maps = buildSourceMaps()
  const payload = await getPayload({ config })

  const cloudflare = await import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: true,
      }),
  )

  const bucket = cloudflare.env.R2 as R2Bucket
  if (!bucket) {
    throw new Error('R2 binding not available — run with PAYLOAD_REMOTE_BINDINGS=true')
  }

  let uploaded = 0
  let skipped = 0
  let failed = 0

  const media = await payload.find({ collection: 'media', limit: 200, pagination: false })

  for (const doc of media.docs) {
    const filename = doc.filename as string | undefined
    if (!filename) continue

    const sourceUrl = resolveSourceUrl(filename, doc.alt as string | undefined, maps)
    if (!sourceUrl) {
      console.warn(`  ✗ no source URL for ${filename} (${doc.alt})`)
      failed++
      continue
    }

    try {
      const didUpload = await uploadToR2(bucket, filename, sourceUrl)
      if (didUpload) {
        uploaded++
        console.log(`  ✓ R2: ${filename}`)
      } else {
        skipped++
        console.log(`  · exists: ${filename}`)
      }
    } catch (err) {
      failed++
      console.warn(`  ✗ R2 failed (${filename}):`, err)
    }
  }

  console.log(`\nR2 backfill: ${uploaded} uploaded, ${skipped} already present, ${failed} failed`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  backfillR2().catch((err) => {
    console.error('R2 backfill failed:', err)
    process.exit(1)
  })
}
