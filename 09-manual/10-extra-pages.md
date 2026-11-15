# 10 — Extra Pages: Products, Consultation and Contact

**Priority:** P1 during the test launch; not part of the P0 launch gate.

## Pickup card

- **Pick ID:** `PAGES-01`
- **Status:** Partial — offer approved and previewed 2026-11-14; pages are live on `softlife-v17`; the first PDF product and its supplied cover are built, but Selar delivery and product-page listing remain.
- **Live pages:** `https://soft.gabochie.com/products/`, `https://soft.gabochie.com/consultation/` and `https://soft.gabochie.com/contact/`
- **Outstanding:** approve the Career Compass price, create the Selar product/order bump, list it only after delivery is tested, create the Selar consultation product/payment link, replace the application email with checkout/booking, and run conversion QA.
- **Need from you:** Career Compass final price approval, booking method, and the Selar payment/product links. The cover, audit price, first-five capacity and guarantee are in place.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/PAGES-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up PAGES-01`; full steps in `00-execution-board.md`.

## Recommendation

The Soft Life System should stay the pillar product. Do not launch a catalogue
of unrelated PDFs that competes with the book.

Use one product page and one consultation page:

1. **Products page** — makes the offer ladder obvious and keeps attention on the
   Complete bundle.
2. **Consultation page** — gives ready buyers a high-touch option without
   cluttering the book funnel.

PDFs should be **implementation toolkits and order bumps**, not a second
business. Only list a toolkit when the file and automated delivery are ready. No
pre-orders.

### First toolkit: The Soft Life Career Compass

**Status:** built, not listed. The A4 interior is 57 pages and includes 24
BLS-matched role profiles, five data visuals, the published Soft Life Score
method, a shortlist worksheet, a 90-day plan, negotiation scripts and a claims
audit. Data are BLS OEWS May 2025 and BLS Employment Projections 2025–35.

**Build:** `/public/softlife/12-products/soft-life-career-compass/build.py`  
**PDF:** `dist/the-soft-life-career-compass.pdf`  
**Source data:** `research/career-data.csv`  
**Template:** `../12-products/PDF-PRODUCT-TEMPLATE.md`

**Proposed offer role:** $19 standalone; $9 order bump at Complete bundle
checkout; included free with the $99 Business Audit. Do not activate until the
Selar delivery, price and a real download test are done.

**Do not:** list it as available until Selar can deliver it automatically and the
price/refund terms are approved.

## Offer ladder

| Step | Offer | Price | Role |
| --- | --- | --- | --- |
| 1 | Free app | $0 | Build trust, capture the account, deliver intro + Chapter 1 |
| 2 | The Soft Life System — Complete bundle | $19.99 founding / $29.99 regular | Core product; unlocks the full library |
| 3 | The Soft Life Career Compass | $19 proposed; $9 order bump | First PDF toolkit; add-on and Complete bundle upgrade |
| 4 | The Soft Life Business Audit | $99 founding for first 5 / $197 standard | High-touch 90-minute audit and written 90-day plan |

The checkout is still on the existing `#/checkout` flow. Until Selar is
configured, the Complete bundle button falls back to the existing secure payment
arrangement by email.

## Products page

**URL:** `https://soft.gabochie.com/products/`  
**Type:** Static HTML, indexable, works without JavaScript.

The page contains:

- Hero with the Complete bundle as the primary action.
- Three-step ladder: free app, Complete bundle, Business Audit.
- What is inside the Complete bundle.
- A toolkit section that explains the PDF plan without listing unreleased
  products.
- Product FAQ: bundle vs audit, toolkit availability, price, refunds, starting
  free.
- Footer links to the consultation page.

### What is intentionally not on the page

- No named PDF toolkit without a final file, price and delivery path.
- No “buy” button for an unreleased product.
- No countdown timer or fake scarcity.
- No claim that the audit guarantees income or clients.

## Consultation page

**URL:** `https://soft.gabochie.com/consultation/`  
**Type:** Static HTML, indexable, works without JavaScript.

### Offer

**The Soft Life Business Audit**

- Pre-audit questionnaire.
- 90-minute one-to-one audit.
- Written 90-day plan.
- Session recording.
- 14-day follow-up.
- The Soft Life System toolkit.

### Price and capacity

- **$99 founding rate for the first five paid audits.**
- **$197 standard rate after that.**
- Capacity is set by you, not by the page. The page currently states five
  founding spots. Change it if you do not want to honour that.
- Payment is arranged after a fit check. The page uses an email application, not
  an open checkout.

### Guarantee

“Complete the pre-work, show up for the audit and engage honestly. If you leave
without a written 90-day plan you can act on, email within seven days and I will
refund the fee.”

This is a planning intensive, not done-for-you delivery, and it is not an income
guarantee.

## Contact page

**URL:** `https://soft.gabochie.com/contact/`  
**Type:** Static HTML, indexable, works without JavaScript.

The page uses the same full-logo header plate and global footer as the rest of
the site. It routes enquiries without pretending to have a form backend:

- Product and billing support by email, with order-ID guidance.
- Business Audit applications to the consultation page.
- Privacy and data requests to the privacy policy, with a clear email subject.
- Affiliates and press to the affiliate route.
- Response expectation: 1–2 business days, Monday–Friday.
- Security note: never send passwords, full card numbers or one-time codes.

The page is included in the sitemap and `llms.txt`. It is the canonical support
route from every footer and the main navigation.

## What is live now

- `/products/`, `/consultation/` and `/contact/` are built as static pages; `/legal/cookies/` is generated with the other policy pages.
- All three pages have canonical URLs, Open Graph/Twitter metadata, structured
  data, sitemap entries and `llms.txt` links.
- Home page, app navigation and footers link to all three pages.
- Blog and legal pages link to Products and Contact; blog footer also links to Consultation.
- `robots.txt` does not block any of the pages.
- Production runs service worker `softlife-v17`, deployed 2026-11-15. It includes the full-logo header plate, original-logo footer plate, global footer, cookie policy, mobile public tab bar, accessible social/share controls and SPA `h1` fixes.
- Production verified on 2026-11-14: both pages return 200 on the custom domain
  and workers.dev, no console errors, no horizontal overflow at 1280px and
  390px, CTAs resolve, and the sitemap/`llms.txt` contain both URLs.
- The Complete bundle buttons still use `/#/checkout`; the consultation buttons
  use `mailto:admin@gabochie.com` with a pre-filled application.
- The Career Compass interior and cover are built and QA-checked locally, but the
  shop page does **not** list it as available. The Selar product, price approval
  and delivery test are outstanding.
- Production preview captured on 2026-11-14 for home, products, consultation and
  mobile; live URLs remain the source of truth.

## Manual steps, in order

1. **Offer ladder approved 2026-11-14.** Complete bundle remains $19.99
   founding / $29.99 regular; the audit is $99 for the first five, then $197.
2. **Consultation promise approved 2026-11-14.** Deliverables, response time,
   booking window and guarantee wording are approved. Legal/counsel review is
   still required before promotion.
3. **Career Compass approval.** Review the 57-page interior and embedded cover,
   then approve the $19 standalone / $9 order-bump / audit-inclusion plan. The
   product template and source audit are in `12-products`; do not list it until
   Selar delivery is tested.
4. **Create the Selar products.** At minimum: the existing Complete bundle, then
   a separate consultation product or payment link if Selar supports it.
5. **Replace the consultation email CTA.** Once there is a Selar product or
   booking form, update the page CTA and application flow. Keep the email
   fallback only if it is monitored.
6. **Add capacity handling.** Decide how you will count the first five and what
   the page says when the founding rate ends.
7. **Run the purchase and application tests.** Confirm the Complete bundle CTA,
   the email application, the payment link and the booking handoff all work.
8. **Add the pages to the launch checklist.** Request indexing in Search Console
   and Bing after the prices and copy are final.

## Acceptance checklist

- [ ] The Complete bundle price on the page matches Selar.
- [x] The audit price and founding limit are approved (2026-11-14).
- [x] The guarantee wording is approved (2026-11-14); legal review pending.
- [ ] The consultation application reaches a monitored inbox.
- [ ] A payment link and booking path exist for an accepted application.
- [ ] No unreleased PDF is presented as available for sale.
- [ ] Career Compass Selar file, price and refund terms are final. Supplied cover is embedded.
- [ ] A real Career Compass purchase downloads and opens the PDF.
- [ ] Both pages pass mobile, keyboard and screen-reader checks.
- [ ] Both pages return 200 without JavaScript and have unique titles/descriptions.
- [ ] Both URLs are in the sitemap and indexed after launch.
- [ ] The pages do not promise income, clients or a specific business result.

## Tracking and analytics

The static pages do not add cookies or tracking scripts. The cookie policy documents the app's local storage, Cloudflare security cookies and Selar/Payhip checkout cookies. `#/checkout` still records the existing `checkout_click` event for signed-in members. Consultation
applications arrive by email, so track them manually in the launch sheet until a
privacy-friendly analytics or booking tool is chosen.

Do not add advertising pixels or session recording before the legal/consent work
is complete.

## Risks

- **Founding scarcity must be real.** If you say five, stop or change the page
  after five paid audits.
- **Do not sell unbuilt PDFs.** A product page with dead products destroys trust
  and creates refund work.
- **Consultation delivery capacity.** A 90-minute audit plus written plan is real
  work. Do not promote more slots than you can deliver.
- **Refund terms.** The audit guarantee is stricter than the digital-product
  refund policy. Keep both consistent with the Refund page and counsel review.
- **Email application is manual.** If `admin@gabochie.com` is not monitored
  daily, replace the mailto with a form/checkout before promoting the page.
- **Prices can change.** The static pages and Selar product must be updated
  together.

## Related files

- `../08-app/app/products/index.html`
- `../08-app/app/consultation/index.html`
- `../08-app/app/contact/index.html`
- `../08-app/app/index.html`
- `../08-app/app/js/app.js`
- `../08-app/app/sw.js`
- `../08-app/app/sitemap.xml`
- `../08-app/app/llms.txt`
- `../08-app/tools/build_blog.py`
- `01-selar-checkout.md`
- `02-legal-and-compliance.md`
- `05-product-qa.md`
- `06-seo-analytics-and-launch.md`
