/**
 * Builds web/src/data/cms-media-map.json from remote D1.
 * Usage: node scripts/build-cms-media-map.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../web/src/data/cms-media-map.json')
const CMS_URL = process.env.PUBLIC_CMS_URL || 'https://lightoflife-cms.nevaquit.workers.dev'

function queryD1(sql) {
  const cmsDir = path.join(__dirname, '../cms')
  const raw = execSync(`npx wrangler d1 execute lightoflife-cms --remote --json --command "${sql.replace(/"/g, '\\"')}"`, {
    cwd: cmsDir,
    encoding: 'utf8',
  })
  const parsed = JSON.parse(raw)
  return parsed[0]?.results ?? []
}

function mediaUrl(relativeUrl) {
  if (!relativeUrl) return undefined
  return relativeUrl.startsWith('http') ? relativeUrl : `${CMS_URL}${relativeUrl}`
}

const sermons = queryD1(
  'SELECT s.slug, m.url FROM sermons s LEFT JOIN media m ON s.thumbnail_id = m.id WHERE m.url IS NOT NULL',
)

const causes = queryD1(
  'SELECT c.slug, m.url FROM causes c LEFT JOIN media m ON c.image_id = m.id WHERE m.url IS NOT NULL',
)

const devotionals = queryD1(
  'SELECT d.slug, m.url FROM devotionals d LEFT JOIN media m ON d.thumbnail_id = m.id WHERE m.url IS NOT NULL',
)

const output = {
  sermons: Object.fromEntries(sermons.map((r) => [r.slug, mediaUrl(r.url)])),
  causes: Object.fromEntries(causes.map((r) => [r.slug, mediaUrl(r.url)])),
  devotionals: Object.fromEntries(devotionals.map((r) => [r.slug, mediaUrl(r.url)])),
}

const teamRows = queryD1(
  "SELECT filename, url FROM media WHERE filename IN ('Rutendo.jpg', 'HJ-Suit-pic.jpg')",
)
const teamByFilename = Object.fromEntries(teamRows.map((r) => [r.filename, mediaUrl(r.url)]))
output.team = {
  'antony-doe': teamByFilename['Rutendo.jpg'],
  'marilyn-doe': teamByFilename['HJ-Suit-pic.jpg'],
}

output.pillars = {
  devotional:
    output.devotionals['raising-children-in-gods-light-protecting-the-next-generation-biblically'],
  sermon: output.sermons['his-yoke-is-easy-and-his-burden-is-light'],
  cause: output.causes['nourishing-bodies-nurturing-souls-a-meal-of-hope'],
}

fs.writeFileSync(OUT, JSON.stringify(output, null, 2))
console.log(
  `Wrote ${OUT}: ${Object.keys(output.sermons).length} sermons, ${Object.keys(output.causes).length} causes, ${Object.keys(output.devotionals).length} devotionals`,
)
