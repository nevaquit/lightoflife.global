import { fetchWordPressSnapshot } from './fetch'
import { importSnapshot } from './import'

async function main() {
  const args = process.argv.slice(2)
  const fetchOnly = args.includes('--fetch-only')
  const importOnly = args.includes('--import-only')

  if (!importOnly) {
    await fetchWordPressSnapshot()
  }

  if (!fetchOnly) {
    await importSnapshot()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
