# PDF Product Creation Template

This is the standard for every Soft Life PDF product. A product is not a
collection of notes. It is a focused tool with one buyer, one promise, one
measurable outcome, and a clear job inside the offer ladder.

## 1. Product brief

Before writing, lock these fields:

| Field | Standard |
| --- | --- |
| Product name | Outcome-led, not topic-led |
| Buyer | One specific person with a specific problem |
| Promise | One sentence: by the end, the buyer can... |
| Format | A4 PDF, reflowable text, data visuals, worksheets |
| Length | 28–60 pages; every page must earn its place |
| Price | $9–$29 standalone; $7–$14 as an order bump |
| Offer role | Tripwire, order bump, bundle upgrade, or audit bonus |
| Delivery | Selar download plus app release note |
| Cover | 1600 × 2400 px minimum; supplied separately |

## 2. Data standard

- Use primary sources where possible: BLS, OEWS, O*NET, Census, World Bank,
  OECD, or a named industry report.
- State the reference period, geography, and source date on the page.
- Never present a national median as a starting salary.
- Keep official statistics separate from editorial scores.
- Label opinion, estimates, and composite scores clearly.
- Show the formula for every composite score.
- Include a source appendix with URLs and retrieval dates.
- If a claim cannot be verified, remove it or label it as unverified.

## 3. Structure

1. Cover
2. Title page and edition
3. Copyright, disclaimer, and data note
4. Contents
5. How to use this guide
6. The problem and the promise
7. The method and data standard
8. Data chapter with 4–6 visuals
9. Core teaching or profiles
10. Decision worksheet
11. 90-day implementation plan
12. Scripts, templates, or checklists
13. Sources, method, and limitations
14. Next step into the offer ladder

## 4. Visual system

- Page: A4, 18 mm margins, 10.5 pt body, 1.55 line height.
- Fonts: Open Sans for body and headings; fall back to system sans.
- Colours: ink `#241536`; purple `#2a0f4a`; gold `#d9b46a`;
  rose `#b85c72`; sage `#6f8f7a`; paper `#fbf8f2`.
- Charts: one message per chart, direct labels, no chartjunk.
- Callouts: insight, caution, action, and data note.
- Every profile page carries the same data block so roles are comparable.
- No stock photos unless they add information. No decorative clutter.

## 5. Build pipeline

```
12-products/<product-slug>/
  README.md                 product brief and offer role
  research/
    roles.csv               curated role list and editorial scores
    profile-notes.csv       role-specific copy
    fetch_bls.py            source fetcher
    career-data.csv         verified data snapshot
  manuscript/
    00-front-matter.md
    01-introduction.md
    ...
    99-back-matter.md
  assets/                   cover and optional images
  build.py                  chart + HTML + PDF builder
  dist/                     final PDF, HTML, and chart SVGs
```

Run:

```bash
python3 12-products/<product-slug>/build.py
```

## 6. QA checklist

- [ ] The promise is visible on the cover, page 1, and the offer page.
- [ ] Every statistic has a source, date, and geography.
- [ ] Every composite score has a published formula.
- [ ] No unverified salary claim survives in the copy.
- [ ] The PDF opens on mobile and desktop.
- [ ] Text is selectable; fonts are embedded.
- [ ] No clipped charts, orphan headings, or blank pages.
- [ ] Page numbers and contents resolve.
- [ ] Links and emails are correct.
- [ ] Cover is final and at least 1600 × 2400 px.
- [ ] Selar file, price, and refund terms match the product page.
- [ ] Complete bundle buyers receive the correct access.
- [ ] A real test purchase downloads and opens the file.

## 7. Offer integration rules

- Do not list a product until the file and delivery exist.
- Do not use fake scarcity or countdown timers.
- Do not promise income, clients, or a specific career result.
- Use the product to move buyers one step up the ladder.
- Keep the front-end promise narrow; sell the next step at the end.
- For a career product, the natural next step is the Complete bundle or the
  Business Audit, not another unrelated PDF.
