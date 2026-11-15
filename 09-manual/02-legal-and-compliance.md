# 02 — Legal, Business and Compliance

**Priority:** P0 — the policies are live but are still production drafts.

## Pickup card

- **Pick ID:** `LEGAL-01`
- **Status:** Waiting on counsel
- **Outstanding:** seller identity, jurisdiction, tax/refund decisions, counsel review, draft-note removal.
- **Need from you:** entity details, target markets, refund window and counsel feedback.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/LEGAL-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up LEGAL-01`; full steps in `00-execution-board.md`.

The legal pages are generated from `tools/build_blog.py` and served at:

- `https://soft.gabochie.com/legal/privacy/`
- `https://soft.gabochie.com/legal/terms/`
- `https://soft.gabochie.com/legal/refund/`

Do not edit the generated HTML directly. Edit the source text in
`tools/build_blog.py`, then run:

```bash
cd /public/softlife/08-app
python3 tools/build_blog.py
cd deploy/cloudflare
sh build.sh
npx wrangler@4.158.0 deploy --config wrangler.toml
```

## A. Business identity

- [ ] Confirm the legal seller name. Current pages say **Gabochie Books**.
- [ ] Confirm the operator/author name. Current pages say **Deon ChristoLove**.
- [ ] Add the business address or registered office if required in the selling jurisdiction.
- [ ] Confirm the governing law and jurisdiction for the Terms.
- [ ] Confirm the support/privacy contact: `admin@gabochie.com`.
- [ ] Confirm the domain and brand name: **The Soft Life System**.
- [ ] Confirm whether a company registration number, VAT number or tax ID must appear.

## B. Counsel review

- [ ] Have counsel review the Privacy Policy.
- [ ] Have counsel review the Terms of Service.
- [ ] Have counsel review the Refund Policy.
- [ ] Confirm the refund window and any digital-goods exceptions. The live draft currently says 14 days.
- [ ] Confirm consumer cancellation rights in the target markets.
- [ ] Confirm chargeback and dispute handling.
- [ ] Confirm the limitation-of-liability and indemnity clauses.
- [ ] Confirm the educational/not-professional-advice disclaimer.
- [ ] Confirm the licence granted to buyers and the no-resale/no-redistribution wording.
- [ ] Remove the public "production draft / counsel review" note after sign-off.
- [ ] Record the review date and version in the pages.

## C. Privacy and data processing

- [ ] Confirm every processor used in production:
  - Cloudflare (hosting, D1, KV, logs)
  - Selar (payments)
  - WhatsApp/Meta, only if the member opts in to the community
  - Email provider, if added
  - Analytics provider, if added
- [ ] Confirm the lawful basis for account, purchase and support data.
- [ ] Confirm the lawful basis and withdrawal process for WhatsApp contact.
- [ ] Confirm profile, acquisition and product-event data are covered by the policy.
- [ ] Confirm retention periods for accounts, purchases and logs.
- [ ] Confirm the process for access, correction, deletion and portability requests.
- [ ] Confirm international transfer wording if buyers are outside the operator's country.
- [ ] Confirm whether a cookie banner is required. The app currently uses no
  analytics or advertising cookies.
- [ ] If analytics or advertising is added, update the policy and add consent
  before collecting data.
- [ ] Confirm the security incident/contact process.

## D. Buyer-facing claims

- [ ] Review the sales and blog copy for income, time-saving or business-outcome claims.
- [ ] Add appropriate "results vary" language where needed.
- [ ] Confirm the checkout promise is deliverable:
  - "One payment"
  - "Access while the service operates"
  - "Updates we release"
  - "All 15 chapters"
  - "14-day refund window"
- [ ] Confirm the refund policy is linked from checkout, receipts and support replies.
- [ ] Confirm the Terms and Privacy links are visible in the footer and checkout.
- [ ] Review `/products/` and `/consultation/` claims, including the audit
  guarantee, founding capacity and the “no income guarantee” statement.
- [ ] Confirm the consultation deliverable is described as a planning intensive,
  not done-for-you delivery or a guaranteed business outcome.
- [ ] Review the statement that Selar processes payments and the app does not store card details.

## E. Tax and consumer compliance

- [ ] Confirm whether Selar collects and remits VAT/GST/sales tax.
- [ ] Confirm the currency displayed to buyers.
- [ ] Confirm invoice/receipt requirements.
- [ ] Confirm the refund and cancellation process complies with local consumer law.
- [ ] Confirm the privacy policy covers the actual countries being sold to.
- [ ] Confirm email marketing consent rules if a newsletter is added.
- [ ] Confirm WhatsApp consent rules and business-initiated messaging rules for the target markets.
- [ ] Confirm the community invite workflow only contacts people who opted in.

## F. Security and contact pages

- [ ] Confirm `https://soft.gabochie.com/.well-known/security.txt` points to a monitored contact.
- [ ] Confirm the privacy contact can receive and process requests.
- [ ] Confirm the support inbox is monitored during the test launch.
- [ ] Consider adding an accessibility statement after the manual accessibility pass.

## Acceptance criteria

- Counsel has reviewed all three policies for the actual selling entity and markets.
- The public draft/counsel note is removed.
- Business identity, refund window, tax handling and contact details are consistent
  across checkout, legal pages, Selar and support replies.
- No unresolved claim on the site promises an outcome the product cannot deliver.

## Current status

- [x] Privacy, Terms and Refund pages drafted and live.
- [x] Checkout links to the refund and terms pages.
- [x] Security contact file live.
- [x] Privacy Policy and Terms updated for profile, acquisition, events and WhatsApp consent.
- [ ] Counsel review completed.
- [ ] WhatsApp consent and community workflow reviewed.
- [ ] Business address/tax details confirmed.
- [ ] Draft/counsel note removed.
