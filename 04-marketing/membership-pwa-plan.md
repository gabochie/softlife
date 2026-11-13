# Membership Site & PWA Ecosystem Plan

> Strategy doc — the Soft Life ecosystem beyond the book. Brainstormed 2026-11-12,
> decisions locked below. Companion prototypes: `06-production/dist/sample.html`
> (sales + read-aloud trial page).

## Locked decisions

| Decision | Lock |
| --- | --- |
| Lead magnet | Free **read-aloud sample** = intro + Chapter 1 (~30 min Ava audio) played right on the sales page |
| Sales page | One page = sample player + book offer ("the sample IS the sales page") |
| Product ladder | Free → **DIY** → **DWY** → **DFY** (pricing below) |
| Payments | Selar (local NGN/GHS cards + mobile money) + international option |
| Affiliates | Dual program: **Selar network** (Africa) + **systeme.io built-in** (global) |
| PWA | Phase 2 — built only after DIY revenue exists; Phase 1 uses systeme.io free tier |
| Voice | Audiobook files (`07-audiobook/`) are the trial content — no new recording needed |

## The funnel

```
TikTok / SEO / affiliates
        ↓
🎓 FREE READ-ALOUD SAMPLE PAGE  (lead magnet — email gate at ~5 min)
        ↓
📧 Email list (Kit / systeme.io)
        ↓
📖 Buy the book (Selar: ebook / print / audiobook bundle)
        ↓
🧰 Implementation ladder: DIY → DWY → DFY
        ↓
🤝 PWA membership site (community, templates, coaching, offline audio)
        ↓
💸 Buyers → affiliates → back to the top of the funnel
```

## Product ladder & pricing logic

| Tier | Who | What | Price (start) |
| --- | --- | --- | --- |
| **Free** | Prospect | Read-aloud sample (intro + ch1) + starter templates | $0 — email capture |
| **DIY** | Book buyer, self-starter | Full book all formats + worksheets + personalized tool stack | ebook $9.99 · audiobook $14.99 · bundle $19.99 |
| **DWY** | Wants help implementing | 90-Day Soft Life Launch (mirrors Book 1 Part V): guided cohort or self-paced, templates installed WITH them | $297–497 (beta cohort cheaper) |
| **DFY** | "Build it for me" | End-to-end build: offer, tools wired, SOPs, welcome sequences | $1,500–5,000 · 50% upfront |

Sales psychology: the book creates the problem the ladder solves — ch14
("90-Day Launch Plan") is where the DIY reader feels implementation friction;
the DWY offer sits at end of ch15 + back matter + audiobook swipe.

## PWA membership (Phase 2 spec sketch)

- Installable PWA (Svelte/Vue shell) + Supabase free tier (auth, member records)
- Per-chapter read-aloud player (chapter-split MP3s already exist), progress sync
- Offline download per chapter; worksheets/forms in-app
- Gated by Selar payment webhooks (tier field on member record)
- Phase 1 instead: systeme.io free tier (funnel + email + basic member area)

## Affiliate program

- **Selar network** for African promoters (mobile-money payouts)
- **systeme.io affiliate** for US/UK/Canada promoters (50% settable commissions)
- Every future tier/product (templates, DWY, DFY) becomes affiliate-able
- Recruitment page: "Earn 50% pointing people to the book" → sample page link

## Build order

1. **Sales + sample page** (prototype first — this week)
2. DIY tier live on Selar (+ audiobook as buyer bonus)
3. Affiliate recruitment page
4. DWY 90-Day cohort (beta pricing, validates demand)
5. **PWA membership** (after ~20 paying customers)
6. DFY (only after DWY demand proven)

## Asset inventory (already built — zero new production needed)

| Asset | Location |
| --- | --- |
| Sample audio (intro + ch1 MP3, mastered) | `07-audiobook/01-soft-life-system/audio/` |
| Full audiobook (19 chapter files) | same folder |
| Cover art | `05-assets/covers/01-soft-life-system/` |
| Brand (plum/gold/cream palette) | `06-production/dist/index.html` CSS |
| Book copy / metadata | `04-marketing/book-01-{metadata,sales-copy}.md` |
| Affiliate tool stack (regional) | `04-marketing/affiliate-resources.md` + `studio-stack-page.md` |

## Open decisions (owner)

1. Currency strategy: USD global + Selar local currency, vs. GHS-specific pricing
2. DWY delivery: live cohort (launch dates) vs. self-paced guided tier (24/7 sales)
3. ✅ Sample depth: intro + full Chapter 1 free — **decided 2026-11-12** (ch1
   "The Hustle Hangover" creates the problem the book solves — give it away)

## Success metrics

- Sample page: play-start rate · email-capture rate (target ≥ 25% of players)
- DIY: book sales/week · bundle take-rate
- DWY: cohort fill · completion rate (target ≥ 60%)
- Affiliates: active promoters · revenue share of total sales
