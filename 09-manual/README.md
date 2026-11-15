# Manual Tasks — Soft Life Test Launch

This directory is the human checklist for the Soft Life product test launch. It
contains only work that cannot be completed by code alone: payments, legal,
accounts, email, content review, browser testing, search-engine setup and launch
operations.

_Last updated: 2026-11-14._

**Start here:** `00-execution-board.md` — pick IDs, outstanding work, step-by-step
guides and the secure handoff input path.

The app itself is live at **https://soft.gabochie.com**. Code deployment and
automated verification are already done. The test-launch gate is the set of
**P0** tasks below.

## Launch gate

Do not invite test buyers until every P0 task is checked.

- [ ] `01-selar-checkout.md` — real Selar product, checkout URL, webhook, live test purchase and refund.
- [ ] `02-legal-and-compliance.md` — counsel review, business details, refund policy and buyer-facing claims.
- [ ] `03-cloudflare-secrets-and-admin.md` — admin access verified and backups taken; move secrets and backups out of `/tmp`.
- [ ] `04-email-and-support.md` — support inbox monitored and a test-launch decision made on transactional email.
- [ ] `05-product-qa.md` — manual purchase, audio, mobile, PWA, browser and accessibility tests.
- [ ] `07-product-deliverables.md` — final EPUB/PDF/cover, placeholders resolved and files uploaded to Selar.
- [ ] `09-onboarding-and-whatsapp-consent.md` — onboarding/consent migration and production verification are done; set up and test the WhatsApp community invite workflow.

P1 tasks can happen during the test launch. P2 tasks are post-launch.

## Priority order

Do these in order. Items 1–4 can run partly in parallel, but do not invite buyers
until the P0 gate is complete.

1. **`CLOUDFLARE-01` — secure the admin and backups today.** Move
   `/tmp/softlife-secrets.json` and the D1 backups to secure storage, delete the
   local copies, enable Cloudflare Access for `/api/admin/*`, and confirm 2FA.
   This is the highest-risk open item.
2. **`DELIVERABLES-01` — finalise the buyer files.** Resolve placeholders, lock
   the EPUB/PDF/cover and have the files ready to upload. Selar cannot be tested
   without them.
3. **`SELAR-01` — create the real product and checkout.** Upload the files,
   create the Complete bundle, connect the webhook and get the public checkout
   URL. This is the critical path to a paid test.
4. **`LEGAL-01` — send the policies to counsel now.** Do not wait for Selar.
   Confirm the seller, refund window, tax position and buyer claims in parallel.
5. **`EMAIL-01` — make support real.** Confirm the inbox is monitored, check
   SPF/DKIM/DMARC, adopt the zero-cost support stack and write the templates.
6. **`QA-01` — test the paid flow.** After Selar works, run a real purchase,
   refund, access check, mobile/PWA pass and accessibility pass.
7. **`WHATSAPP-01` — test the consent workflow.** Create the community and run
   one internal opt-in/withdraw/export test before inviting anyone.
8. **`PAGES-01` — monetise the approved extra pages.** The audit price,
   capacity and guarantee are approved. Decide the first PDF toolkits, create
   the Selar consultation product, replace the mailto CTA and test the handoff.
9. **`SEO-01` — submit and measure.** Add Search Console/Bing, request indexing
   for Products and Consultation, choose the analytics position and decide on
   native sharing.
10. **`AFFILIATE-01` — turn on referrals.** Configure Selar at 30%, test one
    referred purchase and confirm refund reversal.

## Task index

| File | Priority | What it covers |
| --- | --- | --- |
| `00-execution-board.md` | — | Pickup IDs, outstanding work, execution steps, secure input drop |
| `01-selar-checkout.md` | P0 | Product setup, price, checkout URL, webhook, purchase test, refund test |
| `02-legal-and-compliance.md` | P0 | Counsel review, entity details, policies, claims, tax/refund decisions |
| `03-cloudflare-secrets-and-admin.md` | P0 | Secrets, admin password, Cloudflare security, D1 backup, monitoring |
| `04-email-and-support.md` | P0/P1 | Support inbox, email authentication, password reset decision, welcome/receipt email |
| `05-product-qa.md` | P0 | End-to-end purchase, tier, audio, mobile, PWA, browser, accessibility QA |
| `06-seo-analytics-and-launch.md` | P1/P2 | Search Console, sitemap, OG previews, analytics, consent, launch tracking |
| `07-product-deliverables.md` | P0 | Final placeholders, EPUB/PDF/cover, Selar files, buyer package test |
| `08-affiliate-program.md` | P1 | Selar affiliate setup, 30% commission, attribution test, refund reversal |
| `09-onboarding-and-whatsapp-consent.md` | P0 | Technical deploy done; WhatsApp community setup and consent workflow remain |
| `10-extra-pages.md` | P1 | Products and consultation pages; approved offer, Selar links and QA |

The book launch plan is separate: `../04-marketing/book-01-launch-plan.md`.
This directory covers the product test launch, not the full 12-week book launch.

## Current known state

- Live app: `https://soft.gabochie.com`
- Admin: `https://soft.gabochie.com/#/admin`
- Products: `https://soft.gabochie.com/products/`
- Consultation: `https://soft.gabochie.com/consultation/`
- Blog: `https://soft.gabochie.com/blog/`
- Checkout: `https://soft.gabochie.com/#/checkout`
- Webhook endpoint: `https://soft.gabochie.com/api/webhooks/purchase`
- D1: `gabochie-db` with `softlife_*` tables; only the demo user remains after cleanup.
- KV: all 16 audio keys uploaded (`intro`, `ch01`–`ch15`).
- `CHECKOUT_URL` is currently empty; checkout falls back to `mailto:admin@gabochie.com`.
- Frontend copy now shows $19.99 founding / $29.99 regular, 30% affiliate
  commission and access-while-operated. The copy update was deployed on
  2026-11-14 with the onboarding release.
- Onboarding/profile, first-touch UTM capture, product events and explicit
  WhatsApp consent are deployed to production. Migration
  `migrations/002-onboarding.sql` was applied and the Worker was deployed on
  2026-11-14.
- Production signup → onboarding → WhatsApp consent → withdrawal, admin
  dashboard and consent-only CSV export were verified in a real browser. Test
  data was removed.
- Privacy Policy and Terms now document profile/acquisition data, product events
  and the optional WhatsApp community.
- Admin shows profile completion, WhatsApp opt-ins and a consent-only CSV
  export. The dashboard and CSV download were verified in production.
- Admin password and purchase webhook secret were generated and set; the only copy is `/tmp/softlife-secrets.json`.
- Production hardening is live on `softlife-v9`/`v10`: the public Admin link is
  removed, member sessions expire after 30 days and are hashed at rest, and
  audio uses separate 2-hour tokens. Migration
  `003-session-and-audio-tokens.sql` was applied on 2026-11-14; existing
  sessions were cleared and sign-in was verified.
- `softlife-v10` adds the static Products and Consultation pages, navigation and
  footer links, sitemap/`llms.txt` entries and service-worker cache update. It
  was deployed on 2026-11-14 (Worker version
  `dbb7ecd0-55ec-4043-bbe2-94289370ac8c`).
- The Products and Consultation pages are public. The audit offer, first-five
  capacity and guarantee were approved on 2026-11-14; no PDF toolkit is for sale
  yet.
- Pre-migration, post-deploy and pre-`003` D1 backups exist in `/tmp`; they still
  need to be copied off-machine and removed from `/tmp`.
- Legal pages are production drafts and still need counsel review.
- No transactional email service or password reset flow is connected.
- No analytics or Search Console setup is connected.
- Cloudflare managed robots.txt is active and aligned with the no-training policy: search and AI-answer crawlers are allowed, training-only crawlers are disallowed.

## Decisions to make before test launch

| Decision | Why it matters | Default |
| --- | --- | --- |
| Complete bundle price and currency | Selar product, checkout copy, refunds and tax | Frontend: $19.99 founding / $29.99 regular USD; Selar not set |
| Refund window and process | Legal pages, support replies, Selar settings | 14-day draft policy |
| Is email verification required for test launch? | Signup currently accepts any email; purchase claim is by email | Not required for small test |
| Is password reset required for test launch? | No reset flow exists; support must handle manually | Manual support |
| Is analytics required for test launch? | Adds consent/privacy work | Optional for test; internal product events already record signup, onboarding, audio, tasks and checkout clicks |
| Is WhatsApp community contact opt-in? | Contacting people without consent is unsafe and non-compliant | Explicit, unchecked by default; number cleared on withdrawal |
| Is onboarding required? | Extra friction before the free trial | Optional and skippable; dashboard prompts completion |
| Are AI training crawlers allowed? | Cloudflare currently blocks training-only crawlers | Keep blocked |
| Is Cloudflare Access required for admin? | Admin currently uses password + 12-hour session | Password only |
| Is the demo account public? | Demo credentials are shown on sign-in | Keep for test |
| Is the Business Audit price and capacity approved? | The consultation page is live with a public offer | Approved 2026-11-14: $99 founding for first 5, then $197 |
| Which PDF toolkits will be sold? | The product page cannot list unbuilt products | Do not list until file, price and Selar delivery are ready |

## Risks to track

- **Purchase claim by email:** anyone who knows a buyer's email could claim an
  unclaimed purchase by signing up first. Keep the test small, or add email
  verification before a public launch.
- **No password reset:** a member who forgets their password needs manual help.
- **Remaining security hardening:** no CSP, auth rate limiting/CAPTCHA, email
  verification, session rotation or self-service deletion/export. Use a strong
  admin password and put `/api/admin/*` behind Cloudflare Access.
- **Access decision:** Cloudflare Access is still the main open admin control. If
  it is not enabled, record the accepted risk and add rate limiting/Turnstile.
- **Secrets in `/tmp`:** `/tmp` can be cleared. Move them to a password manager
  now and delete the file.
- **Legal drafts are public:** remove the "draft / counsel review" wording once
  counsel signs off.
- **Selar webhook shape is assumed:** the endpoint accepts several common field
  names, but the real Selar payload must be verified with a live test.
- **No automated D1 backup:** exports were taken before migration and after
  deploy, but they are still in `/tmp` and must be moved off-machine.
- **WhatsApp workflow is untested with real contacts:** create the community,
  write the rules and run one internal consent/invite test before launch.
- **WhatsApp consent must be honored:** export only opted-in contacts, never add
  buyers by default, and clear the number when consent is withdrawn.
- **Admin audience contains personal data:** restrict access to the consent CSV
  and delete local exports after use.
- **Consultation capacity is real work:** the offer is approved at five founding
  audits. Do not promise more slots than you can deliver, and update the page
  when the founding rate ends.
- **No PDF toolkit is for sale yet:** the product page deliberately avoids
  naming unreleased PDFs. Add each toolkit only when the file and checkout work.

## How to use this directory

1. Open `00-execution-board.md`, choose a pick ID and follow its guide.
2. Put requested non-secret details in the secure input drop named in the task.
3. Say `Pick up <PICK-ID>` when you want opencode to continue.
4. Check boxes as tasks are completed and add a short dated note when useful.
5. Never paste passwords, API keys or webhook secrets into these files.
6. Re-run the automated checks after any deploy:
   ```bash
   cd /public/softlife/08-app/deploy/cloudflare
   sh build.sh
   npx wrangler@4.158.0 deploy --config wrangler.toml
   ```
7. When all P0 items are checked, run the test-launch smoke test in
   `05-product-qa.md` one final time.

## Not required for test launch

These are intentionally deferred:

- Supabase migration and multi-device sync.
- In-app referral commission ledger and automated payouts. Selar affiliate
  setup is covered by `08-affiliate-program.md`.
- Full email automation and nurture sequences.
- Community, streaks, notifications and offline chapter downloads.
- Books 2–5 product surfaces.
- Standalone PDF toolkit products and pre-orders. The Products page intentionally
  says toolkits ship after the test launch; no unreleased PDF is for sale.
- Full Amazon/KDP launch plan from `../04-marketing/book-01-launch-plan.md`.
- Agentic operating model. Brainstorm only:
  `../10-ideas/AGENTIC-AUTONOMOUS-BUSINESS.md`. Not built, connected or approved.
