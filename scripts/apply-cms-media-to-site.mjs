/**
 * Applies self-hosted CMS media URLs to site-content.json (team + pillar images).
 * Usage: node scripts/apply-cms-media-to-site.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE_PATH = path.join(__dirname, '../web/src/data/site-content.json')
const MAP_PATH = path.join(__dirname, '../web/src/data/cms-media-map.json')

const site = JSON.parse(fs.readFileSync(SITE_PATH, 'utf8'))
const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))

if (map.pillars) {
  site.pillarImages = map.pillars
}

if (map.team && site.team) {
  site.team = site.team.map((member) => ({
    ...member,
    imageUrl: map.team[member.slug] || member.imageUrl,
  }))
}

fs.writeFileSync(SITE_PATH, JSON.stringify(site, null, 2))
console.log('Updated site-content.json with CMS media URLs')
