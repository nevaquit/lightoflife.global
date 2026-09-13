# DNS cutover — do this now (from current Cloudflare screen)

You are on **DNS → Records** for `lightoflife.global`. The zone is **pending** (nameservers not fully active yet). An empty **Add record** A-modal is open — that is the wrong next step.

## 1. Cancel the modal

Click **Cancel** on “Add record”. Do **not** save an empty A record, and do **not** point `@` at `50.6.35.106` (that keeps WordPress/Bluehost).

## 2. Copy Cloudflare nameservers (required)

1. Left sidebar → **Overview** (for `lightoflife.global`).
2. Find **Cloudflare Nameservers** (two hostnames like `xxx.ns.cloudflare.com`).
3. Copy both exactly.

Until the registrar uses these NS, the domain stays “pending” and public traffic still hits Bluehost (`50.6.35.106` / Apache).

## 3. Update nameservers at the registrar (Bluehost)

1. Log into Bluehost → Domains → `lightoflife.global` → Nameservers.
2. Choose **Custom nameservers**.
3. Replace `ns1.bluehost.com` / `ns2.bluehost.com` with the two Cloudflare NS from step 2.
4. Save. Wait until Cloudflare Overview shows the zone **Active** (minutes to 48h).

## 4. Point the website to Pages (prefer Custom Domains UI)

After the zone is Active (or even while preparing DNS):

### Preferred path

1. **Workers & Pages** → **lightoflife-web** → **Custom domains**.
2. Add:
   - `lightoflife.global`
   - `www.lightoflife.global`
3. Let Cloudflare create/fix DNS automatically.

### If you must edit DNS manually

| Action | Type | Name | Content | Proxy |
|--------|------|------|---------|-------|
| **Delete/Edit** any apex `A`/`AAAA` still → `50.6.35.106` | — | `@` | — | — |
| **Add** | CNAME | `@` | `lightoflife-web.pages.dev` | Proxied |
| **Add** | CNAME | `www` | `lightoflife-web.pages.dev` | Proxied |

Cloudflare flattens apex CNAMEs — this is correct for Pages.

## 5. Point CMS to the Worker

1. **Workers & Pages** → **lightoflife-cms** → **Settings** → **Domains & Routes** → **Custom domain**.
2. Add `cms.lightoflife.global`.

Or DNS manually:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `cms` | `lightoflife-cms.nevaquit.workers.dev` | Proxied |

## 6. Preserve email (do not break mail)

Keep / do not blindly proxy:

- Anything for **Titan / HostGator email** (e.g. `mail` → `hostgator.titan.email`)
- All **MX**, **TXT** (SPF/DKIM/DMARC)

Optional cleanup later (hosting leftovers, not email):

- `cpanel`, `whm`, `webdisk`, `ftp`, `webmail` → Bluehost A/CNAME leftovers can be removed **after** cutover is stable if unused.

Set **DNS only** (grey cloud) on `mail` if it is currently Proxied — mail + orange cloud often breaks.

## 7. Verify

```bash
nslookup -type=NS lightoflife.global
# Expect Cloudflare NS, not bluehost

curl -sI https://lightoflife.global
# Expect Server: cloudflare — not Apache

curl -s "https://cms.lightoflife.global/api/sermons?limit=1"
# Expect JSON docs
```

## 8. After live

Redeploy web with:

```toml
PUBLIC_SITE_URL = "https://lightoflife.global"
PUBLIC_CMS_URL = "https://cms.lightoflife.global"
```

Update `web/public/robots.txt` Sitemap line to `https://lightoflife.global/sitemap.xml`.

---

**Success:** Overview = Active · apex serves Astro · `/api/sermons` on `cms.` works · email still receives.
