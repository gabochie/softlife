# The Soft Life Career Compass

A data-backed career design kit for women who want calmer, better-paid work
without pretending that salary alone is freedom.

## Product brief

| Field | Decision |
| --- | --- |
| Buyer | A woman with 2–10 years of work experience who is tired, underpaid, or unsure which career move is actually worth the risk |
| Promise | By the end, she has a shortlist of three realistic career paths, a 90-day transition plan, and the language to negotiate the conditions that make work sustainable |
| Format | A4 PDF, 57 pages, selectable text, five data visuals, 24 role profiles, worksheets |
| Standalone price | $19 proposed |
| Order bump | $9 at Complete bundle checkout |
| Audit | Included free with the $99 Business Audit |
| Role | Front-end tripwire and bundle upgrade |
| Cover | Supplied and embedded from `assets/cover.png` (1024 × 1536; below 1600 × 2400 recommended for print) |

## Why this product exists

The source research in `../Soft Life Career Paths/career-paths` is useful, but
it repeats salary claims from social posts and course pages. Several claims do
not survive a BLS check, especially for wellness, beauty, travel, and solo
service work.

This product turns the research into a defensible buying decision:

- 24 roles matched to BLS occupational codes.
- May 2025 median, 10th percentile, and 90th percentile pay.
- 2025–35 growth and annual openings.
- A transparent Soft Life Score built from pay, schedule control, energy cost,
  entry barrier, and demand.
- Original salary claims audited against the data.
- A shortlist worksheet, a 90-day plan, and negotiation scripts.

## Offer integration

The product has three jobs:

1. **Standalone front door:** $19 for buyers who want a career answer before
   they are ready to buy a business system.
2. **Checkout bump:** add it to the Complete bundle for $9, lifting average
   order value without discounting the core product.
3. **Audit bonus:** include it with the $99 Business Audit so the audit has a
   concrete career-planning asset inside it.

The cover is in place. Do not list the product on the site until the Selar file,
delivery, price, refund terms, and a real download test are ready.

## Build

```bash
python3 build.py
```

If `assets/cover.png`, `assets/cover.jpg`, or `assets/cover.jpeg` exists, the
builder uses it as the full-bleed cover. Otherwise it uses the typographic
placeholder. Keep the cover at 1600 × 2400 px or larger; the supplied 1024 ×
1536 cover is embedded but may be softer in print.

Outputs:

- `dist/the-soft-life-career-compass.pdf`
- `dist/manuscript.html`
- `dist/charts/*.svg`

## Source note

BLS OEWS May 2025 and BLS Employment Projections 2025–35, accessed through
CareerFacts.org because direct BLS pages block automated requests. The research
snapshot is stored in `research/career-data.csv`.

## Selar listing draft

Use this copy only after the final cover, file, price and delivery test are done.

**Title:** The Soft Life Career Compass

**Subtitle:** 24 data-checked careers, a 90-day plan, and the conditions that make work sustainable.

**Price:** $19 proposed.

**Format:** 57-page A4 PDF, instant download.

**Description:**

You do not need another list of “best careers.” You need to know which option
fits your income floor, your energy, and the life you are trying to protect.

The Soft Life Career Compass turns 24 careers into a decision you can test. Every
role is matched to a US Bureau of Labor Statistics occupation and checked against
May 2025 pay, 2025–35 growth, annual openings, and entry requirements. You get a
transparent score, the real pay range, the trade-offs, and a 90-day plan to test
your shortlist before you gamble on a pivot.

**What is inside:**

- 24 role profiles across data and tech, corporate and operations, wellness and
  care, and creative and client work.
- Median, 10th percentile, and 90th percentile pay from BLS May 2025.
- Growth, annual openings, education, and remote-work context.
- The published Soft Life Score method, so you can change the weights.
- A salary-claims audit that shows which viral numbers survive the data.
- A three-career shortlist worksheet and a 90-day validation plan.
- Negotiation scripts for remote work, flexibility, reduced load, pay, and
  promotion.
- A source and method appendix.

**Who it is for:** women with roughly 2–10 years of work experience who are
tired, underpaid, or unsure which career move is worth the risk.

**What it is not:** job placement, guaranteed income, legal or immigration
advice, or a promise that any occupation will be flexible or well paid for every
person.

**Refund and support:** link the live 14-day refund policy at
`https://soft.gabochie.com/legal/refund/` and support at
`admin@gabochie.com`. Confirm both with counsel before listing.

**Tags:** career change, career planning, BLS salary data, soft life, 90-day
plan, women’s career, career compass.

**Order bump copy:** Add the Career Compass for $9 — 24 BLS-checked careers, the
real pay ranges, and a 90-day plan to choose one.

**Audit inclusion:** Include the PDF manually in the Business Audit onboarding
and record it in the client file. The app has no separate PDF entitlement.
