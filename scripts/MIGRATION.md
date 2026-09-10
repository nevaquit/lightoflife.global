# WordPress → Payload CMS Migration

This project migrated from WordPress (Ninetheme Church theme) to Payload CMS v3 on Cloudflare.

## What was migrated

| WordPress source | Payload destination |
|---|---|
| `sermon` CPT | `sermons` collection |
| `posts` (bulletins) | `devotionals` (`type: bulletin`) |
| `prayers` CPT | `devotionals` (`type: prayer`) |
| `causes` CPT | `causes` collection |
| `mu-plugins/hero-section.php` | `homepage` global (Hero block) |

## Run migration

```bash
# Full migration: fetch from live WP + import to Payload
pnpm migrate:wordpress

# Or step by step:
pnpm migrate:fetch    # Pull from https://lightoflife.global/wp-json/
pnpm migrate:import   # Import scripts/data/snapshot.json into Payload
```

Requires CMS env configured (`.env` with `PAYLOAD_SECRET`, D1 bindings for local dev).

## Snapshot data

Fetched content is saved to `scripts/data/snapshot.json` for repeatable imports.

## Legacy WordPress

The original WordPress installation is preserved in `legacy/wordpress/` for reference.
Do not deploy this directory to production.

## Post-migration checklist

- [ ] Upload media from `legacy/wordpress/wp-content/uploads/` to R2 (or re-fetch from live site)
- [ ] Set donation goals on causes (not available in WP REST API)
- [ ] Create admin user at `/admin`
- [ ] Update `web/wrangler.toml` `PUBLIC_CMS_URL` to production CMS URL
- [ ] Point DNS from Bluehost to Cloudflare Pages
