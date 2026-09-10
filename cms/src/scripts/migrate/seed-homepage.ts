import path from 'path'
import { pathToFileURL } from 'url'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { buildHomepageLayout } from './transform'

export async function seedHomepage() {
  const payload = await getPayload({ config })

  const sermons = await payload.find({ collection: 'sermons', sort: '-publishDate', limit: 6 })
  const causes = await payload.find({ collection: 'causes', sort: 'title', limit: 4 })

  const homepage = buildHomepageLayout(
    sermons.docs.map((d) => d.id),
    causes.docs.map((d) => d.id),
  )

  await payload.updateGlobal({ slug: 'homepage', data: homepage })
  console.log('✓ homepage layout seeded')
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  seedHomepage().catch((err) => {
    console.error('Homepage seed failed:', err)
    process.exit(1)
  })
}
