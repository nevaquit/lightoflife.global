import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'

import { Causes } from './collections/Causes'
import { Devotionals } from './collections/Devotionals'
import { Media } from './collections/Media'
import { Sermons } from './collections/Sermons'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isMigrateScript = process.argv.some((value) => /migrate[\\/]/.test(value))
const isProduction = process.env.NODE_ENV === 'production'
const remoteBindings =
  process.env.PAYLOAD_REMOTE_BINDINGS === 'true' || isProduction

const cloudflare =
  isCLI || isMigrateScript || !isProduction
    ? await getCloudflareContextFromWrangler(remoteBindings)
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Light of Life',
    },
  },
  collections: [Users, Media, Sermons, Devotionals, Causes],
  globals: [Homepage],
  cors: [
    process.env.PUBLIC_WEB_URL || 'http://localhost:4321',
    'https://lightoflife-web.pages.dev',
    'https://lightoflife.global',
    'https://www.lightoflife.global',
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    readReplicas: 'first-primary',
  }),
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

function getCloudflareContextFromWrangler(useRemoteBindings: boolean) {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: useRemoteBindings,
      } satisfies GetPlatformProxyOptions),
  )
}
