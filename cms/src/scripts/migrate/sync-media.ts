import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { getPayload } from 'payload'

import config from '../../payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WP_IMAGES_PATH = path.resolve(__dirname, '../../../../web/src/data/wp-images.json')

type WpImages = {
  devotionals: Record<string, string>
}

async function uploadFromUrl(
  payload: Awaited<ReturnType<typeof getPayload>>,
  url: string,
  alt: string,
) {
  const existing = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0].id

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const filename = path.basename(new URL(url).pathname) || 'image.jpg'
  const mimetype = res.headers.get('content-type') || 'image/jpeg'

  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: buffer,
      mimetype,
      name: filename,
      size: buffer.length,
    },
  })

  return doc.id
}

export async function syncMedia() {
  const payload = await getPayload({ config })
  let uploaded = 0

  const sermons = await payload.find({
    collection: 'sermons',
    where: { externalImageUrl: { exists: true } },
    limit: 100,
  })

  for (const sermon of sermons.docs) {
    const url = sermon.externalImageUrl as string | undefined
    if (!url || sermon.thumbnail) continue

    try {
      const mediaId = await uploadFromUrl(payload, url, sermon.title)
      await payload.update({
        collection: 'sermons',
        id: sermon.id,
        data: { thumbnail: mediaId },
      })
      uploaded++
      console.log(`  ✓ sermon image: ${sermon.title}`)
    } catch (err) {
      console.warn(`  ✗ sermon image failed (${sermon.title}):`, err)
    }
  }

  const causes = await payload.find({
    collection: 'causes',
    where: { externalImageUrl: { exists: true } },
    limit: 100,
  })

  for (const cause of causes.docs) {
    const url = cause.externalImageUrl as string | undefined
    if (!url || cause.image) continue

    try {
      const mediaId = await uploadFromUrl(payload, url, cause.title)
      await payload.update({
        collection: 'causes',
        id: cause.id,
        data: { image: mediaId },
      })
      uploaded++
      console.log(`  ✓ cause image: ${cause.title}`)
    } catch (err) {
      console.warn(`  ✗ cause image failed (${cause.title}):`, err)
    }
  }

  const wpImages = JSON.parse(fs.readFileSync(WP_IMAGES_PATH, 'utf8')) as WpImages
  const devotionals = await payload.find({
    collection: 'devotionals',
    limit: 100,
  })

  for (const devotional of devotionals.docs) {
    const slug = devotional.slug as string
    const url = (devotional.externalImageUrl as string | undefined) || wpImages.devotionals[slug]
    if (!url || devotional.thumbnail) continue

    try {
      const mediaId = await uploadFromUrl(payload, url, devotional.title as string)
      await payload.update({
        collection: 'devotionals',
        id: devotional.id,
        data: { thumbnail: mediaId },
      })
      uploaded++
      console.log(`  ✓ devotional image: ${devotional.title}`)
    } catch (err) {
      console.warn(`  ✗ devotional image failed (${devotional.title}):`, err)
    }
  }

  console.log(`\nMedia sync complete: ${uploaded} images uploaded to R2`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  syncMedia().catch((err) => {
    console.error('Media sync failed:', err)
    process.exit(1)
  })
}
