# Light of Life Global

Edge-native, headless website for [lightoflife.global](https://lightoflife.global) — Payload CMS v3 on Cloudflare Workers, Astro frontend on Cloudflare Pages.

## WordPress Migration

Content was migrated from the legacy WordPress site (Ninetheme Church theme):

| WordPress | Payload |
|---|---|
| `sermon` CPT (17 items) | `sermons` |
| `posts` bulletins (6 items) | `devotionals` (type: bulletin) |
| `prayers` CPT (6 items) | `devotionals` (type: prayer) |
| `causes` CPT (4 items) | `causes` |
| Hero mu-plugin | `homepage` global |

```bash
# Fetch latest from live WordPress
pnpm migrate:fetch

# Import snapshot into Payload (requires CMS running locally)
pnpm migrate:import
```

See [scripts/MIGRATION.md](scripts/MIGRATION.md) for full details. Legacy WordPress files are in `legacy/wordpress/`.

## Repository Layout

```
lightoflife.global/
├── cms/                  # Payload CMS v3 → Cloudflare Workers (D1 + R2)
├── web/                  # Astro SSR → Cloudflare Pages
├── scripts/              # Migration tooling + WP snapshot data
├── legacy/wordpress/     # Archived WordPress installation
└── package.json          # Monorepo root
```

## Architecture

| Layer | Stack | Cloudflare Services |
|-------|-------|---------------------|
| **CMS** | Payload v3 + Next.js + OpenNext | Workers, D1 (SQLite), R2 (media) |
| **Frontend** | Astro 5 + Tailwind CSS v4 | Pages (SSR via Workers) |

The frontend queries the Payload REST API at `/api/*`. Media files are served from R2 through the CMS worker.

> **Note:** Payload on Workers requires a **paid Workers plan** due to the ~3 MB bundle size limit on the free tier.

## Content Schema

| Type | Slug | Fields |
|------|------|--------|
| **Sermons** | `sermons` | title, slug, speaker, videoUrl, audioUrl, thumbnail, publishDate |
| **Devotionals** | `devotionals` | title, slug, content (rich text), scriptureReference, publishDate |
| **Causes** | `causes` | title, slug, description, image, donationGoal, currentRaised |
| **Homepage** | `homepage` (global) | Block-based layout: Hero, Media Grid, Featured Sermons, Featured Causes, CTA Banner |
| **Media** | `media` | alt, uploads → R2 |

## Design Theme

Warm, contemporary palette inspired by Woman Evolve:

- **Backgrounds:** cream `#FAF7F2`, oatmeal `#F0EBE3`
- **Accents:** blush `#F4C4B0`, terracotta `#C4736B`, rose `#D4897F`
- **Typography:** Playfair Display (headings), DM Sans (body), espresso `#2C2416`

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (paid Workers plan for CMS)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) v4+

## Quick Start (Local Development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Authenticate Wrangler

```bash
npx wrangler login
npx wrangler whoami
```

### 3. Create Cloudflare resources

```bash
# D1 database
cd cms
npx wrangler d1 create lightoflife-cms
# Copy the database_id into cms/wrangler.toml

# R2 bucket
npx wrangler r2 bucket create lightoflife-media
```

### 4. Configure secrets

```bash
cd cms

# Generate a secret: openssl rand -hex 32
cp .env.example .env
# Add PAYLOAD_SECRET to .env

npx wrangler secret put PAYLOAD_SECRET
```

### 5. Run database migrations

```bash
cd cms
pnpm payload migrate:create
pnpm payload migrate
```

### 6. Start dev servers

```bash
# Terminal 1 — CMS (port 3001)
pnpm dev:cms

# Terminal 2 — Frontend (port 4321)
pnpm dev:web
```

- **Admin panel:** http://localhost:3001/admin
- **Frontend:** http://localhost:4321
- **REST API:** http://localhost:3001/api/sermons

## Deployment (Linux / CI required for CMS)

CMS deploy uses OpenNext on Cloudflare Workers. **Windows builds work** with the WASM patch script, but Linux CI is recommended for production.

```bash
# From cms/ — uses patch-fs-wasm.mjs automatically
npm run deploy

# Or manually:
node --import ./scripts/patch-fs-wasm.mjs ./node_modules/@opennextjs/cloudflare/dist/cli/index.js build
node --import ./scripts/patch-fs-wasm.mjs ./node_modules/@opennextjs/cloudflare/dist/cli/index.js deploy
```

### GitHub Actions secrets required

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Workers + Pages deploy |
| `CLOUDFLARE_ACCOUNT_ID` | `365965a7234fe266200abe63be3b63ba` |
| `PAYLOAD_SECRET` | Payload auth (same as cms/.env) |

Trigger: push to `main` or workflow_dispatch on `.github/workflows/deploy-cloudflare.yml`.

### Critical: `NEXT_PRIVATE_MINIMAL_MODE=1`

Set in `cms/wrangler.toml` — prevents `Dynamic require of middleware-manifest.json` 500 errors on Workers.


### Deploy Frontend (Cloudflare Pages)

```bash
cd web

# Update wrangler.toml with production CMS URL
# PUBLIC_CMS_URL = "https://lightoflife-cms.<your-subdomain>.workers.dev"

pnpm build
pnpm deploy
```

Or connect the `web/` directory to Cloudflare Pages via Git:

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → Connect to Git
2. Build command: `pnpm build`
3. Build output directory: `dist`
4. Root directory: `web`
5. Environment variable: `PUBLIC_CMS_URL` = your CMS worker URL

### Custom domains

| Service | Suggested domain |
|---------|------------------|
| CMS / Admin | `cms.lightoflife.global` |
| Frontend | `lightoflife.global` |
| Media (R2) | Configure R2 custom domain or serve via CMS `/api/media/file/*` |

## Wrangler Configuration

### `cms/wrangler.toml` (Workers)

- `D1` binding → SQLite database for Payload
- `R2` binding → media uploads (sermon thumbnails, cause images, audio)
- `nodejs_compat` + `global_fetch_strictly_public` compatibility flags
- OpenNext output at `.open-next/worker.js`

### `web/wrangler.toml` (Pages)

- `pages_build_output_dir = "dist"`
- `PUBLIC_CMS_URL` var for API endpoint

## API Examples

```bash
# List sermons
curl https://your-cms.workers.dev/api/sermons?sort=-publishDate&depth=1

# Homepage layout
curl https://your-cms.workers.dev/api/globals/homepage?depth=2

# Single devotional
curl "https://your-cms.workers.dev/api/devotionals?where[slug][equals]=daily-bread&depth=1"
```

## Next Steps

1. Create your first admin user at `/admin`
2. Configure the Homepage global with Hero + Media Grid blocks
3. Add sermon, devotional, and cause content
4. Point `lightoflife.global` DNS to Cloudflare Pages
5. ~~Add Lexical rich-text serializer to devotional detail pages~~ ✅ Done
6. Integrate a donation provider (Stripe, PayPal) on cause pages

## License

MIT
