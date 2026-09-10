---
name: lightoflife-global
description: >-
  Project skill for lightoflife.global — Payload CMS on Cloudflare Workers,
  Astro frontend on Pages, WordPress migration, Woman Evolve design theme.
  Use when working in this repo on CMS, web, deploy, DNS, sermons,
  devotionals, causes, or Cloudflare bindings for Light of Life Global.
---

# Light of Life Global

Edge-native ministry site: Payload v3 (Workers + D1 + R2) + Astro 5 (Pages).

## Stack map

| Path | Role |
|------|------|
| `cms/` | Payload CMS, OpenNext → Worker `lightoflife-cms` |
| `web/` | Astro SSR → Pages `lightoflife-web` |
| `scripts/` | WP migration snapshot + import |
| `legacy/wordpress/` | Archived WordPress (do not deploy) |

## Bindings (exact names required)

```toml
# cms/wrangler.toml
D1   → lightoflife-cms
R2   → lightoflife-media
ASSETS → .open-next/assets
```

Wrong binding names (e.g. `undefinedD1`) cause Worker Error 1101.

## URLs

| Env | URL |
|-----|-----|
| CMS | https://lightoflife-cms.nevaquit.workers.dev |
| Frontend | https://lightoflife-web.pages.dev |
| Production domain | lightoflife.global (pending DNS from Bluehost) |
| CMS admin | `/admin` on CMS worker |

## Env vars

- CMS: `PAYLOAD_SECRET` (wrangler secret)
- Web: `PUBLIC_CMS_URL=https://lightoflife-cms.nevaquit.workers.dev`

## Design tokens

- Backgrounds: cream `#FAF7F2`, oatmeal `#F0EBE3`
- Accents: blush `#F4C4B0`, terracotta `#C4736B`, rose `#D4897F`
- Text: espresso `#2C2416`
- Fonts: Playfair Display (headings), DM Sans (body)

## Content counts (post-migration)

- 17 sermons, 12 devotionals, 4 causes, homepage global

## Deploy

**Windows:** CMS bundled deploy fails on `resvg.wasm?module` filename — use GitHub Actions (`.github/workflows/deploy-cloudflare.yml`) or Linux/WSL.

**Secrets (GitHub):** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PAYLOAD_SECRET`

```bash
pnpm install
pnpm deploy:cms   # Linux/CI only
pnpm deploy:web
```

## DNS cutover (Bluehost → Cloudflare Pages)

Domain NS currently still Bluehost (`ns1.bluehost.com` / `ns2.bluehost.com`). Public apex still serves WordPress on Apache.

**Claude Extension prompt (copy/paste):** [`scripts/CLAUDE-DNS-CUTOVER-PROMPT.md`](../../../scripts/CLAUDE-DNS-CUTOVER-PROMPT.md)

Target after cutover:
- `lightoflife.global` / `www` → Pages `lightoflife-web`
- `cms.lightoflife.global` → Worker `lightoflife-cms`
- Preserve MX/TXT for email
- Then set `PUBLIC_SITE_URL=https://lightoflife.global` and `PUBLIC_CMS_URL=https://cms.lightoflife.global`

## API patterns

```bash
curl "$PUBLIC_CMS_URL/api/sermons?sort=-publishDate&depth=1"
curl "$PUBLIC_CMS_URL/api/globals/homepage?depth=2"
curl "$PUBLIC_CMS_URL/api/devotionals?where[slug][equals]=slug&depth=1"
```

Lexical rich text: render via `web/src/lib/lexical.ts` on devotional pages.

## Migration commands

```bash
pnpm migrate:fetch
pnpm migrate:import      # CMS running locally
pnpm migrate:sync-media
```

## Related skills

- `online-church-expert` — ministry UX and content architecture
- `online-business-expert` — SEO, analytics, launch
- `premium-web-development` — engineering quality bar
- `cloudflare`, `wrangler`, `workers-best-practices` — platform ops
