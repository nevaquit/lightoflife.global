import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { getPayload } from 'payload'

import config from '../../payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_PATH = path.resolve(__dirname, '../../../../scripts/data/snapshot.json')

type SnapshotItem = {
  slug: string
  legacyWordPressId?: number
  externalImageUrl?: string
}

type Snapshot = {
  sermons: SnapshotItem[]
  causes: SnapshotItem[]
}

export async function restoreExternalImages() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as Snapshot
  const payload = await getPayload({ config })
  let restored = 0

  for (const item of snapshot.sermons) {
    if (!item.externalImageUrl) continue

    const existing = await payload.find({
      collection: 'sermons',
      where: { slug: { equals: item.slug } },
      limit: 1,
    })
    const doc = existing.docs[0]
    if (!doc) continue

    await payload.update({
      collection: 'sermons',
      id: doc.id,
      data: { externalImageUrl: item.externalImageUrl },
    })
    restored++
    console.log(`  ✓ sermon image URL: ${item.slug}`)
  }

  for (const item of snapshot.causes) {
    if (!item.externalImageUrl) continue

    const existing = await payload.find({
      collection: 'causes',
      where: { slug: { equals: item.slug } },
      limit: 1,
    })
    const doc = existing.docs[0]
    if (!doc) continue

    await payload.update({
      collection: 'causes',
      id: doc.id,
      data: { externalImageUrl: item.externalImageUrl },
    })
    restored++
    console.log(`  ✓ cause image URL: ${item.slug}`)
  }

  console.log(`\nRestored ${restored} external image URLs from snapshot`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  restoreExternalImages().catch((err) => {
    console.error('Restore external images failed:', err)
    process.exit(1)
  })
}
