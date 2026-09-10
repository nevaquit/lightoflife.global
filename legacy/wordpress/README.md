# Legacy WordPress Installation

This directory contains the original WordPress site (Ninetheme Church theme on Bluehost)
that powered lightoflife.global before migration to Payload CMS.

**Do not deploy this directory.** It is preserved for:

- Content reference during migration
- Media path lookup (`wp-content/uploads/` on production server)
- Plugin/theme configuration reference

## Key paths

| Path | Purpose |
|---|---|
| `wp-content/mu-plugins/hero-section.php` | Homepage hero (migrated to Payload `homepage` global) |
| `wp-config.php` | Database credentials (rotate if repo is public) |
| `wp-content/plugins/.listing` | Production plugin inventory |

## Production data not in git

The following exist on Bluehost but were never committed:

- `wp-content/themes/` (Church theme)
- `wp-content/uploads/` (media files)
- `wp-content/plugins/` (most plugins)
- SQL dumps (`iwp-db-received.sql`, etc.)

Fetch live content via `pnpm migrate:fetch` or export from production.
