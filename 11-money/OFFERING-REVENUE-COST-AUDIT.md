# Offering, Revenue and Cost Audit — The Soft Life System

**Audit date:** 14 November 2026  
**Scope:** Current app, eBook/audio bundle, affiliate offer, planned DWY/DFY ladder, Selar checkout and Cloudflare hosting.  
**Status:** Pre-revenue. The app is live, but checkout is not connected and no paid sales have been recorded.  
**Currency:** USD unless stated. All figures are pre-tax and exclude the owner's time unless noted.

> This is a commercial planning document, not tax, legal or investment advice. Fees
> and platform limits change; verify them in Selar and Cloudflare before launch.

## 1. Executive summary

The offer is viable as a low-overhead digital product. The production work is
already sunk, Cloudflare hosting is nearly free at test scale, and Selar removes
the need to build payments and file delivery. The constraint is not infrastructure.
It is price architecture, proof, distribution and support.

**The core economics work at low volume, but the current price/affiliate combination
is weak.**

| Question | Answer |
| --- | --- |
| Can it make money? | Yes, at 100+ direct bundle sales. |
| Is it launch-ready? | No. Checkout, final files, legal review, email/support and manual QA remain. |
| What does it cost to run? | Roughly $0–72/year in infrastructure at test scale, plus $500–1,500 one-time legal review and payment fees. |
| Where does the money go? | Selar fees, refunds, affiliate commissions and support time — not hosting. |
| Biggest revenue lever? | Price and affiliate rate. |
| Biggest risk? | Selling a $19.99 bundle through 50% affiliates leaves only ~$6.50 per sale. |

### Key numbers at the planned $19.99 bundle price

Assumes Selar USD fee of **10% + $0.50**, a **5% refund reserve**, and no tax.

| Scenario | Gross | Selar fees | Affiliate | Refunds | Net before fixed | Profit after $1,500 fixed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 direct buyers | $1,999 | $250 | $0 | $100 | $1,649 | $149 |
| 1,000 direct buyers | $19,990 | $2,499 | $0 | $1,000 | $16,492 | $14,992 |
| 1,000 buyers, 30% affiliate on 30% | $19,990 | $2,499 | $1,799 | $1,000 | $14,692 | $13,192 |
| 1,000 buyers, 50% affiliate on 50% | $19,990 | $2,499 | $4,998 | $1,000 | $11,494 | $9,994 |
| 1,000 buyers, 50% affiliate on all | $19,990 | $2,499 | $9,995 | $1,000 | $6,497 | $4,997 |

### Five decisions before the test launch

1. **Lock one price story.** The frontend now shows **$19.99 founding** and
   **$29.99 regular**. Older marketing docs still use $9.99/$14.99/$19.99, so
   align them before the test launch. Keep component prices raised so the bundle
   still looks like a discount.
2. **Keep the affiliate rate at 30% on the $19.99 bundle.** The frontend and API
   now use **30% standard**; configure Selar to match. At $19.99/50%, the seller
   keeps ~$6.50 per sale after fees and the refund reserve, before support, tax
   and owner time.
3. **Show the guarantee when it is decided.** The checkout page now shows the
   price and links the 14-day refund policy; add the guarantee wording once the
   owner approves it.
4. **Finish the files and checkout before inviting buyers.** Placeholders, final
   EPUB/PDF, Selar URL, webhook and a real purchase/refund test are launch gates.
5. **Do not run paid ads at $19.99 until conversion is proven.** At a $1 CPC and
   2% conversion, customer acquisition cost is $50 against ~$16.49 net revenue.

## 2. What is being sold

### Current live offer

| Tier | What the buyer gets | Price |
| --- | --- | --- |
| Free | Introduction + Chapter 1 audio, 90-day task plan, progress tracking, affiliate link | $0 |
| Complete bundle | eBook (PDF + EPUB), all 15 audio chapters (~3.8 hours), 90-day plan, worksheets, monthly review ritual, updates we release | $19.99 founding / $29.99 regular |

### Planned ladder from `04-marketing/membership-pwa-plan.md`

| Tier | What it is | Planned price |
| --- | --- | --- |
| DIY | eBook + audiobook + worksheets + tool stack | eBook $9.99 · audiobook $14.99 · bundle $19.99 |
| DWY | Guided 90-day implementation cohort | $297–497 |
| DFY | Done-for-you business build | $1,500–5,000 |

### What is live versus planned

| Item | State |
| --- | --- |
| Free tier and audio gate | Live |
| Complete tier in app | Live |
| Selar checkout URL | Not connected |
| Purchase webhook | Built, not tested with Selar |
| Final eBook/PDF upload | Not confirmed |
| DWY/DFY checkout and delivery | Not built |
| Affiliate tracking in app | Built |
| Affiliate commission payout | Manual/Selar network, not configured |
| Email nurture and receipts | Not connected |
| Analytics/attribution | Not connected |

## 3. Offering audit

### Scorecard

Subjective commercial assessment, not a technical review.

| Dimension | Score /10 | Finding |
| --- | ---: | --- |
| Clarity of promise | 6 | Strong outcome and price now shown, but the single-offer statement needs tightening. |
| Perceived value | 8 | eBook + 3.8 hours of audio + app + worksheets is a strong bundle. |
| Differentiation | 8 | The free audio sample and 90-day task engine are unusual and useful. |
| Proof | 2 | No testimonials, reviews, buyer count or case study yet. |
| Pricing | 5 | Inconsistent across docs; $19.99 is low for the bundle and too low for 50% affiliates. |
| Purchase friction | 6 | Clean UI and price now shown, but checkout is an email fallback until Selar is connected. |
| Trust | 5 | Professional design, but draft legal pages and no social proof. |
| Monetisation depth | 4 | One-time sale only; DWY/DFY ladder is not live. |
| Operations | 5 | Manual support, no password reset, no transactional email. |
| **Overall** | **5.4** | Strong product, under-monetised and not yet launch-ready. |

### Strengths

- The free sample is also the sales page. The buyer can experience the product
  before paying.
- Audio plus app plus written plan creates a higher-value bundle than an eBook
  alone.
- One-time pricing is simple and fits buyers who are tired of subscriptions.
- Selar supports local payment methods and international cards.
- The affiliate program gives the product a distribution channel without ad spend.
- Blog, SEO/AEO, sitemap, llms files and structured data are already built.
- Hosting costs are close to zero at test scale.

### Weaknesses

- **Price was missing; now the frontend is ahead of the checkout.** The app shows
  $19.99 founding / $29.99 regular, but the Selar product price and URL are not
  configured yet.
- **Price inconsistency remains in the marketing docs.** The launch plan uses
  $0.99/$9.99; the membership plan uses $9.99/$14.99/$19.99; the frontend and
  this audit use $19.99/$29.99.
- **50% affiliate commission is too high for a $19.99 product.** The frontend and
  API now use 30% standard; Selar still needs to be configured to match. At 50%,
  a healthy 82.5% net margin becomes 32.5%.
- **No recurring revenue.** Every sale is one-time; LTV depends on the DWY/DFY
  ladder, which is not live.
- **No proof.** There are no testimonials, results, reviews or "as featured in"
  signals.
- **No email capture/nurture.** Free users can leave and never be contacted.
- **No analytics.** The funnel cannot be measured beyond manual counts.
- **Files are not final.** The manuscript still has placeholders and the final
  EPUB/PDF have not been verified for sale.
- **Legal is still draft.** Counsel review and business details are pending.
- **Access terms still need legal confirmation.** The frontend now says access
  lasts while the service operates and includes updates we release; the Terms
  should state the same.
- **Purchase claim by email is risky.** A buyer's purchase can be claimed by
  someone who signs up with the same email first.
- **Support is manual.** No password reset, no transactional email and no help
  desk.

### Offering recommendations

1. **Lead with one clear offer:** "The Soft Life System Complete bundle —
   eBook, all 15 audio chapters, 90-day plan and worksheets. One payment."
2. **Keep the price on the checkout page and next to the CTA.** The $19.99
   founding / $29.99 regular pair is now in the frontend; keep Selar and marketing
   copy aligned with it.
3. **Add a guarantee** that matches the refund policy and is easy to understand.
4. **Put 3 proof elements on checkout** after the first test buyers: a quote, a
   result, and a one-line bio.
5. **Add an order bump or next step.** Example: "Want help implementing it?
   Join the DWY waitlist" or a $27–47 template pack.
6. **Keep the free tier generous but require an account** so every free user is
   contactable.
7. **Make the Terms match the new access copy:** access while the product is
   operated, with updates included for a stated period or major version.

## 4. Price architecture

### Current references

| Source | eBook | Audiobook | Bundle |
| --- | --- | --- | --- |
| Launch plan | $0.99 launch / $9.99 regular | — | Paperback $19.99; hardcover $29.99 |
| Membership plan | $9.99 | $14.99 | $19.99 |
| App checkout | — | — | Not shown |

### Recommended architecture

| Offer | Test launch | Regular | Rationale |
| --- | ---: | ---: | --- |
| eBook only | $9.99 | $12.99 | Low-friction entry point |
| Audiobook only | $14.99 | $19.99 | Audio carries the production value |
| Complete bundle | **$19.99 founding** | **$29.99** | Bundle saves versus separate prices and includes the app/worksheets |
| DWY beta cohort | $297 | $497 | Implementation support, limited seats |
| DFY | $1,500+ | $5,000 | Custom build, 50% upfront |

At the test prices, eBook + audiobook = $24.98, so the $19.99 bundle is a clear
$4.99 saving. At the regular prices, eBook + audiobook = $32.98, so the $29.99
bundle is still a $2.99 saving. This keeps the bundle coherent.

**Alternative if the price must stay at $19.99:** keep 30% affiliate commission,
avoid paid ads, and treat the bundle as a volume/lead product. Do not pair $19.99
with 50% commission and paid acquisition.

## 5. Unit economics

### Selar fee assumptions

Selar's free Starter plan has no monthly fee. Transaction fees vary by currency.
The figures below use the conservative international USD assumption:

- **USD:** 10% + $0.50 per sale
- **GHS:** 5% + GH₵1 per sale (plus GH₵15 withdrawal, GH₵100 minimum, per
  third-party reporting; verify in the Selar dashboard)
- **NGN:** 4% + ₦50 per sale

If most buyers pay in GHS/NGN, margins improve slightly, but FX conversion and
withdrawal costs may offset part of the gain.

### Per-sale economics at 5% refunds

"30% affiliate" and "50% affiliate" columns assume the commission is paid on the
gross list price; Selar fees are not recovered on refunds.

| Price | Selar fee | Net direct | Net direct after refunds | Net with 30% affiliate | Net with 50% affiliate |
| ---: | ---: | ---: | ---: | ---: | ---: |
| $9.99 | $1.50 | $8.49 | $7.99 | $4.99 | $3.00 |
| $14.99 | $2.00 | $12.99 | $12.24 | $7.74 | $4.75 |
| $19.99 | $2.50 | $17.49 | $16.49 | $10.49 | $6.50 |
| $24.99 | $3.00 | $21.99 | $20.74 | $13.24 | $8.25 |
| $29.99 | $3.50 | $26.49 | $24.99 | $15.99 | $10.00 |
| $39.99 | $4.50 | $35.49 | $33.49 | $21.49 | $13.50 |

**Read this table before setting the affiliate rate.** At $19.99, a 50% affiliate
sale leaves ~$6.50 after fees and the refund reserve, before support, tax and
owner time. At $29.99, the same sale leaves ~$10.00.

### Fee pass-through option

Selar can pass the transaction fee to the buyer. On a $19.99 USD sale:

- Seller receives the full $19.99.
- Buyer pays $22.49.
- Seller net after 5% refunds is ~$18.99.

This improves margin but raises the displayed price by 12.5%. It may reduce
conversion. Do not pass the fee on silently; show the final price clearly.

## 6. Revenue potential

### Funnel reality check

Revenue is audience-constrained, not market-constrained. At $19.99 and ~$16.49
net per direct sale, the funnel looks like this:

| Monthly visitors | 1% buyers | 2% buyers | 3% buyers | 5% buyers |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 10 / $200 gross | 20 / $400 | 30 / $600 | 50 / $1,000 |
| 10,000 | 100 / $1,999 | 200 / $3,998 | 300 / $5,997 | 500 / $9,995 |
| 50,000 | 500 / $9,995 | 1,000 / $19,990 | 1,500 / $29,985 | 2,500 / $49,975 |

To sell **1,000 bundles in 90 days** at $19.99, the business needs approximately:

| Visitor-to-buyer conversion | Visitors required |
| ---: | ---: |
| 1% | 100,000 |
| 2% | 50,000 |
| 3% | 33,333 |
| 5% | 20,000 |
| 10% | 10,000 |

That is why affiliates, email and existing audience matter more than the product
page alone.

### Annual scenarios at $19.99

| Units | Gross | Net direct | Profit after $1,500 fixed | Net with 30% affiliate on 30% | Profit after fixed |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | $1,999 | $1,649 | $149 | $1,469 | −$31 |
| 300 | $5,997 | $4,947 | $3,447 | $4,408 | $2,908 |
| 1,000 | $19,990 | $16,492 | $14,992 | $14,692 | $13,192 |
| 3,000 | $59,970 | $49,475 | $47,975 | $44,077 | $42,577 |
| 5,000 | $99,950 | $82,458 | $80,958 | $73,462 | $71,962 |

The 100-unit row shows the test-launch reality: it can cover a modest legal bill
but it is not a business by itself. The 1,000-unit row is a credible first-year
target if the launch plan's audience and affiliate goals are met.

### Upside from the ladder

These are not in the base case because the offers are not built or validated.

| Offer | Conservative | Stretch | Notes |
| --- | ---: | ---: | --- |
| DWY cohort | 10 seats × $297 = $2,970 | 10 seats × $497 = $4,970 | 20–40 hours of delivery per cohort |
| DFY projects | 2 × $1,500 = $3,000 | 2 × $5,000 = $10,000 | High-touch, not scalable at test stage |
| Affiliate-driven sales | 30% commission on referred sales | 50% only if price rises | Performance-based, no upfront ad risk |

One DWY cohort can equal roughly 150–250 bundle sales in gross revenue. That is
the real revenue lever after the book is validated.

### Paid ads reality

At a $1 CPC and ~$16.49 net per direct $19.99 sale:

| Conversion | CAC | Profit per sale at $19.99 | Profit per sale at $29.99 |
| ---: | ---: | ---: | ---: |
| 1% | $100 | −$83.51 | −$75.01 |
| 2% | $50 | −$33.51 | −$25.01 |
| 3% | $33.33 | −$16.84 | −$8.34 |
| 5% | $20 | −$3.51 | +$4.99 |
| 10% | $10 | +$6.49 | +$14.99 |

**Conclusion:** paid ads are a losing channel for a $19.99 bundle until conversion
is unusually high or CPC is very low. Use organic content, email, affiliates and
the free sample first. At $29.99, ads only become interesting around 5% conversion.

## 7. Cost to run

### One-time setup

| Item | Lean | Recommended | Notes |
| --- | ---: | ---: | --- |
| Legal review | $0–500 | $500–1,500 | Budget assumption; get a quote. Do not launch on drafts. |
| Final file/cover work | $0 | $0–300 | Only if a designer/final proof is needed. |
| Selar setup | $0 | $0 | Free Starter plan. |
| Cloudflare setup | $0 | $0 | Already built. |
| Accounting/tax setup | $0–150 | $150–400 | Depends on jurisdiction. |
| Launch assets | $0–300 | $300–600 | Optional design, email templates, samples. |
| **Total** | **$0–950** | **$950–2,800** | Excludes owner time. |

### Recurring costs at test scale

| Item | Lean | Recommended | Notes |
| --- | ---: | ---: | --- |
| Cloudflare Workers | $0 | $60/year | Paid plan is safer for password-hashing CPU limits. |
| Domain/DNS/SSL | $0–15/year | $15/year | `soft.gabochie.com` is a subdomain; no new domain required. |
| Selar monthly | $0 | $0 | Free plan is enough for a digital bundle. |
| Email inbound | $0 | $0 | Existing mailbox / Cloudflare Email Routing. |
| Transactional email | $0 | $0–240/year | Optional for test; needed for reset/welcome at scale. |
| Email platform | $0 | $0–348/year | Free tiers may be enough at first. |
| Analytics | $0 | $0 | Cloudflare Web Analytics can be cookieless. |
| Accounting/tax | $0 | $0–600/year | Depends on revenue and jurisdiction. |
| **Infrastructure total** | **$0–15** | **$75–1,263** | Excludes payment fees, ads and owner time. |

### Variable costs

| Cost | Rate | At 100 buyers | At 1,000 buyers | At 5,000 buyers |
| --- | ---: | ---: | ---: | ---: |
| Selar USD fees | 10% + $0.50 | $250 | $2,499 | $12,495 |
| Refund reserve | 5% of gross | $100 | $1,000 | $4,998 |
| Affiliate (30% on 30% of sales) | 9% of gross | $180 | $1,799 | $8,996 |
| Support labor | 10 min/ticket, 5–10% ticket rate | 0.8–1.7 h | 8–17 h | 42–83 h |
| Support opportunity cost | $25/hour | $21–42 | $208–417 | $1,042–2,083 |

### Cost at volume

| Volume | Gross | Selar fees | Refunds | Affiliate (30%/30%) | Fixed | Approx. profit |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | $1,999 | $250 | $100 | $180 | $1,000–1,500 | −$31–$469 |
| 1,000 | $19,990 | $2,499 | $1,000 | $1,799 | $1,500 | $13,192 |
| 5,000 | $99,950 | $12,495 | $4,998 | $8,996 | $1,500 | $71,962 |

**Hosting is not the constraint.** At these volumes, Cloudflare costs well under
1% of revenue. Payment fees, affiliate commissions and support dominate.

## 8. Break-even and cash

### Break-even units at $19.99

Fixed cost of **$1,500** for legal and setup.

| Sales mix | Net per sale | Units to break even |
| --- | ---: | ---: |
| Direct, 5% refunds | $16.49 | 91 |
| 30% affiliate on all, 5% refunds | $10.49 | 143 |
| 50% affiliate on all, 5% refunds | $6.50 | 231 |
| 30% affiliate on 30% of sales | $14.69 | 103 |

### Break-even range

| Fixed cost | Direct units | All-50%-affiliate units |
| ---: | ---: | ---: |
| $500 | 31 | 77 |
| $1,000 | 61 | 154 |
| $1,500 | 91 | 231 |
| $2,000 | 122 | 308 |

### Cash needed

- **Minimum test budget:** ~$500–2,000 for legal review, domain/email, Cloudflare
  and a small launch reserve.
- **Refund reserve:** keep 5–10% of gross sales available.
- **Payout timing:** Selar GHS/USD funds typically reach the wallet before
  withdrawal; NGN is faster. Do not spend expected revenue before settlement.
- **Affiliate payouts:** budget monthly, not per sale.
- **Ads:** do not fund ads from the first sales until CAC is proven below net
  revenue per sale.

## 9. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Price inconsistency | Buyer confusion, weak conversion, affiliate disputes | One price table across app, Selar, legal and marketing |
| 50% affiliate on $19.99 | Low margin, no room for ads/support | 30% standard or $29.99 price |
| Access terms not yet legal-reviewed | Ambiguous expectations and refund disputes | Match the Terms to "access while the service operates" |
| Draft legal pages | Consumer, privacy and refund exposure | Counsel review before test launch |
| Unfinished eBook files | Buyer receives incomplete product | Resolve placeholders, rebuild, open on devices |
| Checkout/webhook not live | No revenue or failed upgrades | Real purchase + duplicate + refund test |
| No email service | Buyers lack access/reset help | Manual process for test; provider before scale |
| No analytics | Cannot improve funnel | Privacy-friendly analytics before launch |
| Purchase claim by email | Someone claims another buyer's purchase | Email verification before public scale |
| No password reset | Support burden and lost users | Add reset flow or documented manual process |
| Digital file sharing | Revenue leakage | Accept some leakage; no DRM; focus on app access |
| Paid ads at low price | Negative unit economics | Organic/affiliate first; prove CAC |
| Tax/VAT unclear | Margin and compliance risk | Confirm Selar handling and local obligations |
| Selar fee/FX changes | Margin changes | Recheck fees before pricing; keep buffer |
| Support load | Owner time drain | FAQ, templates, help desk at scale |

## 10. Recommendations

### Before the test launch

1. **Set the price in Selar.** The frontend now shows $19.99 founding / $29.99
   regular; configure the Selar product to match.
2. **Reconcile the refund policy.** The live legal page says 14 days; make Selar,
   support and the checkout copy match it.
3. **Set affiliate commission in Selar to 30% standard.** The frontend and API
   now show 30%; keep 50% only for a small launch-partner group or after raising
   the price.
4. **Finalise access terms.** The frontend now says access lasts while the
   service operates; make the Terms say the same and define the update promise.
5. **Finish the buyer files.** Resolve placeholders, rebuild EPUB/PDF, verify on
   iOS/Android/desktop, upload to Selar.
6. **Connect checkout and webhook.** Test a real purchase, duplicate webhook and
   refund.
7. **Add proof.** Three testimonials, a short author bio, and a clear guarantee.
8. **Add a lightweight email/analytics path.** Even a manual buyer list plus
   cookieless analytics is better than none.
9. **Budget $500–1,500 for legal review.** This is the largest unavoidable
   one-time cost.
10. **Do not spend on ads yet.** Use the free sample, email, blog and affiliates.

### During the test launch

- Cap the founding cohort at 25–50 buyers to keep support manageable.
- Track visitors, signups, checkout clicks, purchases, refunds and support reasons.
- Ask every buyer for one sentence of feedback and permission to quote.
- Refund quickly and record the reason.
- Watch Selar webhook delivery and duplicate behaviour.
- Keep a daily cash/refund reserve.

### After the test launch

- Raise the bundle to $29.99 once proof and conversion are established.
- Launch one DWY beta cohort at $297–497; it is the fastest route to meaningful
  revenue.
- Keep affiliates at 30% unless the price supports 50%.
- Add order bumps and a post-purchase upsell.
- Consider a membership/subscription only after the one-time offer is validated.
- Re-run this model with actual conversion, refund and support data.

## 11. Assumptions and sources

### Model assumptions

- USD list prices; international Selar fee of 10% + $0.50.
- 5% refund reserve; refunds return the product price, fees and affiliate
  commission are not recovered.
- Affiliate commission is paid on gross list price.
- No tax/VAT in the model; confirm treatment with Selar and an accountant.
- Fixed costs of $1,500 for the base case, $1,000 for the test case and $2,000
  for the 3,000–5,000 unit cases.
- Owner time and content production are excluded from cash costs.
- The DWY/DFY ladder is upside, not base case.

### Sources

- Selar pricing: <https://selar.com/pricing> — NGN 4% + ₦50; other currencies vary.
- Selar fee list (USD 10% + $0.50, GHS 5% + GH₵1): <https://selar.com/blog/how-to-sell-online>
- Selar affiliate minimums (30% standard, 20% for high-ticket): <https://help.selar.com/portal/en/kb/articles/checklist-for-product-listing-on-the-affiliate-network-17-6-2024>
- Cloudflare Workers pricing: <https://developers.cloudflare.com/workers/platform/pricing/>
- Cloudflare Workers limits: <https://developers.cloudflare.com/workers/platform/limits/>
- App and offer docs: `08-app/README.md`, `04-marketing/membership-pwa-plan.md`,
  `04-marketing/book-01-launch-plan.md`, `09-manual/`.

### Figure notes

- Numbers are rounded to the nearest cent or dollar in the text; the CSV model
  keeps the exact arithmetic.
- "Net" means after Selar fees, affiliate commission and refund reserve, before
  fixed costs, tax and owner time.
- "Profit" means net after the stated fixed costs.
- See `financial-model.csv` for the editable scenario table.

## 12. Verdict

**Build the test launch around the $19.99 founding bundle, but do not scale it
with 50% affiliates or paid ads.** The product has strong perceived value and
near-zero hosting costs. The path to real money is: finish the files and checkout,
prove 25–50 direct sales, collect proof, raise the price to $29.99, then sell a
$297–497 DWY cohort to the buyers who want implementation help.

The business can be profitable at 100–300 sales per year. It becomes interesting
at 1,000 sales or one to two DWY cohorts. It does not become interesting by
selling a $19.99 product through 50% affiliates and $1 CPC ads.
