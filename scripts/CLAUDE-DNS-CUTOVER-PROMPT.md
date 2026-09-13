# Claude Extension Prompt — Point lightoflife.global Nameservers to Cloudflare

Copy everything below the line into Claude (browser extension / Claude.ai) while logged into Cloudflare Dashboard and your domain registrar (Bluehost or wherever `.global` NS are managed).

---

## Mid-flight note (Sep 2026)

Zone `lightoflife.global` **already exists** in Cloudflare and may show **pending**. Imported Bluehost records still point many hostnames at `50.6.35.106`.

If Claude opens an empty **Add record → A** modal: **Cancel it**. Do not create a blank A record and do not point apex at Bluehost.

Use [`DNS-NEXT-STEPS-NOW.md`](./DNS-NEXT-STEPS-NOW.md) for click-by-click from that screen.

## Current state (verified)

| Asset | Status |
|-------|--------|
| CMS Worker | Live: `https://lightoflife-cms.nevaquit.workers.dev` (Payload API works) |
| Astro frontend | Live: `https://lightoflife-web.pages.dev` (Cloudflare Pages) |
| Public domain `https://lightoflife.global` | Still **Bluehost** — `Server: Apache`, IP `50.6.35.106`, NS historically `ns1.bluehost.com` / `ns2.bluehost.com` |
| Cloudflare account | `nevaquit@gmail.com` — Account ID `365965a7234fe266200abe63be3b63ba` |
| Pages project | `lightoflife-web` |
| Worker | `lightoflife-cms` |
| D1 | `lightoflife-cms` |
| R2 | `lightoflife-media` |

## Goal

1. Add (or open) the Cloudflare zone for `lightoflife.global`.
2. Note Cloudflare’s assigned nameservers (example format: `ada.ns.cloudflare.com` + `bob.ns.cloudflare.com` — **use the exact pair Cloudflare shows for THIS zone**).
3. Update the domain’s nameservers at the **registrar** (Bluehost account that owns `lightoflife.global`, or the `.global` registry reseller) to those Cloudflare NS values.
4. In Cloudflare DNS, create records so traffic hits the new stack — not Bluehost.
5. Attach custom domains on Pages + Worker.
6. Verify SSL active and WordPress is no longer the public origin.

## Exact steps to execute (use browser; do not skip)

### A. Cloudflare — Add site / open zone

1. Go to https://dash.cloudflare.com → select account **Nevaquit@gmail.com's Account**.
2. If `lightoflife.global` is **not** listed: **Add a domain** → enter `lightoflife.global` → choose Free plan (or existing plan).
3. Open the zone → **Overview** → copy **Cloudflare Nameservers** (exactly two hostnames). Write them down.

### B. Cloudflare DNS records (zone DNS → Records)

Delete or disable any A/AAAA/CNAME that still point at Bluehost (`50.6.35.106` or bluehost hostnames) for `@` / `www` once you are ready to cut over.

Create / ensure:

| Type | Name | Target / content | Proxy |
|------|------|------------------|-------|
| CNAME | `@` (or Apex / CNAME flattening) | `lightoflife-web.pages.dev` | Proxied (orange cloud) |
| CNAME | `www` | `lightoflife-web.pages.dev` | Proxied |
| CNAME | `cms` | `lightoflife-cms.nevaquit.workers.dev` | Proxied (or Worker custom domain) |

Notes:

- Prefer attaching custom domains via **Workers & Pages → lightoflife-web → Custom domains** (`lightoflife.global`, `www.lightoflife.global`) so Cloudflare auto-creates correct DNS.
- Prefer **Workers → lightoflife-cms → Settings → Domains & Routes → Custom domain** → `cms.lightoflife.global`.
- Keep email MX records if the ministry uses Bluehost/Google/Microsoft email — **do not delete MX** unless you intend to move email too. Import existing MX/TXT/SPF/DKIM from Bluehost before cutover if missing.

### C. Registrar — Change nameservers (critical)

1. Log into Bluehost (or the registrar that controls NS for `lightoflife.global`).
2. Domain Manager → `lightoflife.global` → **Nameservers** → **Custom / Use custom nameservers**.
3. Replace `ns1.bluehost.com` / `ns2.bluehost.com` with the **exact two Cloudflare nameservers** from step A.
4. Save. Propagation: often 15 minutes–48 hours (commonly under a few hours).

### D. Pages + Worker custom domains

1. **Pages** `lightoflife-web`: add `lightoflife.global` and `www.lightoflife.global`. Wait until status = Active.
2. **Worker** `lightoflife-cms`: add `cms.lightoflife.global`. Wait until Active.
3. Set Pages production env var: `PUBLIC_CMS_URL=https://cms.lightoflife.global` (then redeploy web if needed).

### E. Verification checklist (must pass)

Run / confirm:

```bash
nslookup -type=NS lightoflife.global
# Expect Cloudflare NS, NOT ns1.bluehost.com

curl -sI https://lightoflife.global
# Expect Server: cloudflare — NOT Apache
# Expect HTML from Astro Pages, not WordPress X-Pingback

curl -sI https://www.lightoflife.global
# Expect cloudflare + redirect or same site

curl -s "https://cms.lightoflife.global/api/sermons?limit=1"
# Expect JSON with docs array

curl -sI https://lightoflife.global/wp-admin
# Should NOT serve live WordPress admin from Bluehost (404 or Cloudflare Pages response)
```

Also open in browser:

- https://lightoflife.global — ministry homepage (hero, sermons, causes)
- https://lightoflife.global/sermons — sermon list
- https://cms.lightoflife.global/admin — Payload login

### F. Rollback (if broken)

Revert registrar NS to Bluehost `ns1.bluehost.com` / `ns2.bluehost.com` to restore WordPress temporarily. Do **not** delete Cloudflare zone until stable.

## Constraints

- Do **not** delete Bluehost WordPress until DNS + HTTPS + CMS admin are verified on the new stack.
- Preserve email DNS (MX/TXT) unless user explicitly asks to migrate email.
- Prefer Cloudflare UI for custom domains over inventing wrong A records.
- Report back: assigned Cloudflare NS pair, DNS records created, custom domain statuses, verification curl results.

## Success criteria

`lightoflife.global` resolves via Cloudflare nameservers, serves the Astro site on Pages, and `cms.lightoflife.global` serves Payload — with SSL active and Bluehost Apache no longer responding for the apex domain.
