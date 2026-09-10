import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { buildHomepageLayout } from './transform'
import type {
  TransformedCause,
  TransformedDevotional,
  TransformedSermon,
} from './transform'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../../../scripts/data')
const SNAPSHOT_PATH = path.join(DATA_DIR, 'snapshot.json')

type Snapshot = {
  sermons: TransformedSermon[]
  causes: TransformedCause[]
  devotionals: TransformedDevotional[]
}

async function upsertByLegacyId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'sermons' | 'devotionals' | 'causes',
  legacyId: number,
  data: Record<string, unknown>,
) {
  const existing = await payload.find({
    collection,
    where: { legacyWordPressId: { equals: legacyId } },
    limit: 1,
  })

  if (existing.docs[0]) {
    return payload.update({
      collection,
      id: existing.docs[0].id,
      data,
    })
  }

  return payload.create({ collection, data })
}

export async function importSnapshot(snapshot?: Snapshot) {
  const data =
    snapshot ||
    (fs.existsSync(SNAPSHOT_PATH)
      ? (JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8')) as Snapshot)
      : null)

  if (!data) {
    throw new Error(`No snapshot found at ${SNAPSHOT_PATH}. Run: pnpm migrate:fetch`)
  }

  const payload = await getPayload({ config })

  console.log('Importing into Payload...')

  const sermonIds: string[] = []
  for (const sermon of data.sermons) {
    const doc = await upsertByLegacyId(payload, 'sermons', sermon.legacyWordPressId, sermon)
    sermonIds.push(String(doc.id))
    console.log(`  ✓ sermon: ${sermon.title}`)
  }

  const causeIds: string[] = []
  for (const cause of data.causes) {
    const doc = await upsertByLegacyId(payload, 'causes', cause.legacyWordPressId, cause)
    causeIds.push(String(doc.id))
    console.log(`  ✓ cause: ${cause.title}`)
  }

  for (const devotional of data.devotionals) {
    await upsertByLegacyId(payload, 'devotionals', devotional.legacyWordPressId, devotional)
    console.log(`  ✓ devotional (${devotional.type}): ${devotional.title}`)
  }

  const homepage = buildHomepageLayout(sermonIds.slice(0, 6), causeIds.slice(0, 4))
  try {
    await payload.updateGlobal({ slug: 'homepage', data: homepage })
  } catch {
    await payload.findGlobal({ slug: 'homepage' })
    await payload.updateGlobal({ slug: 'homepage', data: homepage })
  }
  console.log('  ✓ homepage layout seeded')

  console.log('\nMigration complete.')
  console.log(`  ${data.sermons.length} sermons`)
  console.log(`  ${data.causes.length} causes`)
  console.log(`  ${data.devotionals.length} devotionals`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  importSnapshot().catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
  })
}
