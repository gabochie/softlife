# 08 — Soft Life App (soft.gabochie.com)

The dedicated PWA for The Soft Life System: one brand, one persona, one problem —
a business that works 15 hours a week. Onboarding → signup → member dashboard
with the book's 90-day launch plan as a trackable task engine, read-aloud
library, built-in affiliate system, complete-bundle checkout, super-admin
operations dashboard, and a static SEO/AEO blog.

Strategy doc: `04-marketing/membership-pwa-plan.md`.

Test-launch manual tasks: `../09-manual/` — P0/P1 checklist for Selar checkout,
legal review, secrets/admin, email/support, product QA and SEO/analytics.

## Live

**https://soft.gabochie.com** — Cloudflare Worker `softlife` serving the static PWA,
`/api/*`, D1 `gabochie-db` (tables prefixed `softlife_*`), and KV namespace
`SOFTLIFE_AUDIO` with all 16 audio keys (`audio:intro`, `audio:ch01`–`audio:ch15`).

- Member app: `https://soft.gabochie.com/`
- Products: `https://soft.gabochie.com/products/`
- Consultation: `https://soft.gabochie.com/consultation/`
- Contact: `https://soft.gabochie.com/contact/`
- Blog / journal: `https://soft.gabochie.com/blog/`
- Checkout: `https://soft.gabochie.com/#/checkout`
- Admin login: `https://soft.gabochie.com/#/admin`
- Discovery: `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`,
  `/openapi.json`, `/.well-known/security.txt`
- Demo account: `demo@softlife.app` / `demo1234`

## Run locally

```bash
cd 08-app
python3 server/api.py          # serves app/ + API on http://localhost:8100
```

The demo account is auto-seeded on first run with the 16-task launch plan.
Shortcut: `http://localhost:8100/?demo=1`. Delete `server/softlife.db` to reset
local data.

## Deploy

The Cloudflare edition lives in `deploy/cloudflare/`:

```bash
cd 08-app/deploy/cloudflare
sh build.sh
npx wrangler@4.158.0 d1 execute gabochie-db --remote --file schema.sql
npx wrangler@4.158.0 deploy --config wrangler.toml
```

Always deploy from `08-app/deploy/cloudflare` with the explicit `--config
wrangler.toml`. Deploying from `08-app` previously created an accidental Worker.

Required Worker secrets:

```bash
npx wrangler@4.158.0 secret put ADMIN_PASSWORD --config wrangler.toml
npx wrangler@4.158.0 secret put PURCHASE_WEBHOOK_SECRET --config wrangler.toml
```

Non-secret settings live in `wrangler.toml` `[vars]`:

```toml
SITE_URL = "https://soft.gabochie.com"
CHECKOUT_URL = ""                       # legacy alias for the Selar product URL
SELAR_CHECKOUT_URL = ""                 # Selar: recommended for Africa
PAYHIP_CHECKOUT_URL = ""                # Payhip: recommended for North America and rest of world
SUPPORT_EMAIL = "admin@gabochie.com"
ADMIN_SESSION_HOURS = "12"
```

Upload or replace chapter audio with the key format `audio:<slug>`:

```bash
for f in ../../server/audio/*.mp3; do
  slug="$(basename "$f" .mp3)"
  npx wrangler@4.158.0 kv key put "audio:$slug" \
    --path "$f" \
    --namespace-id=5b3c59765e0443ec857f44f68299928e --remote
done
```

Production backend note: this MVP uses D1 + KV so the app is live now. The
Supabase migration remains the scale path; the frontend contract in
`app/js/api.js` stays unchanged.

## Blog and discovery files

The blog, legal pages, feeds, sitemap, robots policy, `llms.txt`,
`llms-full.txt`, and `openapi.json` are generated from `tools/build_blog.py`.
OG cards, the cover JPEG, and `favicon.ico` come from
`tools/make_blog_images.py`.

```bash
cd 08-app
python3 tools/build_blog.py
python3 tools/make_blog_images.py
cd deploy/cloudflare && sh build.sh && npx wrangler@4.158.0 deploy --config wrangler.toml
```

Cloudflare prepends its zone-level managed robots.txt / Bot Preference Sync to
`/robots.txt` on the custom domain and can edge-block training crawlers. The
generated policy is aligned with that no-training stance: search and AI answer
engines (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
Claude-User, PerplexityBot) are allowed; training-only crawlers (GPTBot,
ClaudeBot, CCBot, Google-Extended, Applebot-Extended, meta-externalagent) are
disallowed.

If training crawlers should be allowed, set Training to **Allow** and turn off
**Enable Bot Preference Sync** in Cloudflare:

- Dashboard → `gabochie.com` → Security → Settings → Bot traffic →
  AI Crawler and Agent access policies.
- The Wrangler OAuth token only has `zone:read`; changing this needs a token with
  **Bot Management: Edit** or the dashboard toggle.

## Structure

```text
08-app/
  README.md                  ← this file
  server/
    api.py                   local dev API + static server (Python stdlib, SQLite)
    schema.sql               users · sessions · tasks · projects · referrals
    audio/                   ch01.mp3–ch15.mp3 source files
    softlife.db              dev database (gitignore-worthy)
  app/                       the PWA (vanilla JS SPA, hash router)
    index.html               shell + metadata + static fallback home
    manifest.webmanifest     installable-app manifest
    sw.js                    service worker (offline app shell, v17)
    css/app.css              Soft Life brand + blog/admin/checkout styles
    js/api.js                backend adapter — the ONLY file that talks to /api
    js/store.js              member session + admin token store
    js/app.js                router, views, member shell, checkout, admin
    products/                static product ladder and PDF toolkit status
    consultation/            static Business Audit offer and application
    contact/                 static support, billing, privacy and partnership routing
    blog/                    generated blog index, 5 posts, .md variants, feeds
    legal/                   generated privacy, terms, refund pages
    assets/icons/            generated by tools/make_icons.py
    assets/logo-softlife-header.png padded full-colour master logo for the cream header plate
    assets/logo-softlife.png   padded full-colour master logo for the cream footer plate
    assets/hero-soft-life*.jpg responsive homepage hero images
    assets/audio/            read-aloud trial audio (from 07-audiobook)
    assets/blog/             generated OG cards + cover JPEG
    favicon.ico              generated favicon
    robots.txt               generated crawler policy
    sitemap.xml              generated sitemap
    llms.txt, llms-full.txt  generated agent/AEO discovery files
    openapi.json             generated API description
    .well-known/security.txt generated security contact
  tools/
    make_icons.py            regenerates PWA icons
    build_blog.py            regenerates blog, legal, feeds, discovery files
    make_blog_images.py      regenerates OG cards, cover JPEG, favicon
```

## Views

| Route | Access | What |
| --- | --- | --- |
| `/products/` | public | Static product ladder: free app, Complete bundle, Business Audit |
| `/consultation/` | public | Static Business Audit offer, application and guarantee |
| `#/` | public | Onboarding: promise, free read-aloud trial, system, signup CTA |
| `#/signup` / `#/signin` | public | Email auth; captures `?ref=CODE` attribution |
| `#/checkout` | public/member | Complete bundle checkout; Selar/Payhip URLs or email fallback |
| `#/dashboard` | member | Progress bar, next task, quick links, tier badge |
| `#/tasks` | member | 90-day launch plan (preloaded, week-grouped, checkable) + custom tasks |
| `#/listen` | member | Read-aloud library: free intro + chapter 1, locked chapters, upsell |
| `#/affiliate` | member | Personal referral link, click/signup stats, how-it-works |
| `#/account` | member | Profile, tier, logout |
| `#/admin` | protected | Super-admin login, members, tier/role, purchases, referrals, audio status |

Static pages: `/blog/`, `/blog/<slug>/`, `/products/`, `/consultation/`,
`/contact/`, `/legal/privacy/`, `/legal/terms/`, `/legal/refund/`.

## Backend contract (stable — swap-friendly)

The frontend only talks to `/api/*` through `js/api.js`. The local server
implements it with SQLite; production uses D1 + KV behind the same routes:

```text
POST /api/signup {email,password,name,ref} → {token,user}
POST /api/signin {email,password}          → {token,user}
POST /api/signout                          → {ok}
GET  /api/me                               → user
GET  /api/tasks                            → {tasks[]}
POST /api/tasks {title,week}               → {task}
POST /api/tasks/toggle {id}                → {task}
GET  /api/affiliate                        → {ref_code,clicks,signups,commission_rate}
GET  /api/config                           → {siteUrl,checkoutUrl,selarUrl,payhipUrl,country,supportEmail,freeAudio,allAudio,tiers}
GET  /api/audio/{slug}.mp3                 → gated MP3 stream with Range support
POST /api/webhooks/purchase                → {ok,upgraded,duplicate?}
POST /api/admin/login                      → {token,role,expires_at}
POST /api/admin/logout                     → {ok}
GET  /api/admin/overview                   → dashboard counts + audio status
GET  /api/admin/users?q=&limit=&offset=    → member list
POST /api/admin/users/:id/tier {tier}      → member
POST /api/admin/users/:id/role {role}      → member
GET  /api/admin/referrals                  → referral events
GET  /api/admin/purchases                  → purchase records
GET  /api/admin/audio                      → uploaded/missing audio keys
```

Purchase webhook authentication: send `Authorization: Bearer <secret>` or
`X-Webhook-Secret: <secret>`. The endpoint deduplicates `order_id`, stores the
purchase, and upgrades a matching user by email. A signup with the same email
claims the latest purchase tier automatically.

## MVP → production checklist

- [x] Local dev: full flow working + screens verified
- [ ] Supabase migration (auth, DB, RLS) behind the same `/api` contract
- [x] Checkout page + purchase webhook + tier upgrade pipeline
- [ ] Connect real Selar product URL and webhook payload/credentials
- [x] Full chapter audio files in KV (16/16)
- [x] Super-admin dashboard for members, tiers, roles, purchases, referrals, audio
- [x] Static blog, legal drafts, feeds, sitemap, robots, llms, OpenAPI, security.txt
- [x] OG cards, cover JPEG, favicon
- [ ] Legal pages reviewed by counsel
- [x] Cloudflare managed robots.txt reviewed (training blocked; search/answer crawlers allowed)
- [x] Deploy: static app + API to **soft.gabochie.com** (PWA installable)
- [x] Live audit: CTAs, 404 fallback, service worker, axe WCAG AA, mobile overflow
- [ ] Referral click tracking on public pages + real commission ledger
- [ ] Email service for signup/transactional mail (systeme.io or Kit)

## Roadmap (post-MVP rollout)

Progress sync across devices · projects/SOP builder · community area ·
DWY 90-day program space · streaks & notifications · offline chapter downloads ·
Books 2–5 as additional "systems" in the same app.
