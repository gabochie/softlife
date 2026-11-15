# Execution Board — Pickups and Step-by-Step Guides

This is the working handoff board for outstanding manual work. Each task has a
pick ID, the inputs needed from you, an execution sequence, and the phrase to use
when you want opencode to continue.

## How pickup works

1. Pick a task below and open its manual file if you need more detail.
2. Put non-secret notes and decisions in the secure input drop:
   `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/<PICK-ID>.md`
3. Copy `_TEMPLATE.md` in that directory and rename it to the pick ID.
4. For a secret or token, prefer a password-manager reference. If an actual file
   is unavoidable, keep it outside the repo, mode `600`, and reference its path.
5. Tell opencode: `Pick up <PICK-ID>`.
6. opencode reads the board and the secure input, executes what can be automated,
   returns only the remaining human actions, verifies the result, and updates the
   task file and this board.

Never put passwords, API tokens, webhook secrets or buyer data in this manual
folder. The secure input directory is outside the project and is the only local
drop used for handoff.

## Status

| Pick | Status | Next action |
| --- | --- | --- |
| `SELAR-01` | Waiting | Create Selar product, checkout URL and webhook; approve live test purchase |
| `LEGAL-01` | Waiting | Supply entity details and counsel feedback |
| `CLOUDFLARE-01` | Partial | Move secrets/backups, enable Access, complete CSP/rate-limit/email-verification hardening |
| `EMAIL-01` | Waiting | Confirm inbox/auth; adopt zero-cost support stack and manual-vs-automated decision |
| `QA-01` | Blocked | Complete Selar first, then real purchase, devices and accessibility |
| `SEO-01` | Waiting | Connect Search Console/Bing; decide analytics and native social sharing |
| `DELIVERABLES-01` | Waiting | Finalise files, cover and Selar upload |
| `AFFILIATE-01` | Waiting | Configure Selar affiliate program and test referral purchase |
| `WHATSAPP-01` | Ready | Create community, rules, invite and test consent workflow |
| `PAGES-01` | Partial | Offer approved and previewed; add Selar/booking link, PDF details and test pages |
| `CAREER-PDF-01` | Partial | Interior and supplied cover embedded; approve price, Selar upload/order bump, then list after a real download test |

Status meanings: **Ready** can start now; **Partial** has verified work but
outstanding manual steps; **Waiting** needs an external account/decision;
**Blocked** cannot complete until another task is done.

## Priority order

Do these in order. Start the security, deliverables and legal tracks in parallel.

1. **`CLOUDFLARE-01`** — move secrets/backups, delete `/tmp` copies, enable
   Access, confirm 2FA. Highest risk; do this today.
2. **`DELIVERABLES-01`** — lock the final EPUB/PDF/cover and buyer package.
3. **`SELAR-01`** — upload the files, create the Complete bundle, connect the
   webhook and get the public checkout URL.
4. **`LEGAL-01`** — send the live policies to counsel now; confirm seller,
   refund, tax and claims.
5. **`EMAIL-01`** — confirm a monitored support inbox, email authentication and
   reply templates.
6. **`QA-01`** — real purchase/refund, tier/audio access, mobile/PWA and
   accessibility.
7. **`WHATSAPP-01`** — create the community and run one consent/invite/export
   test before inviting buyers.
8. **`PAGES-01`** — offers approved; add Selar/booking, finalise PDF details,
   replace the mailto CTA and test both pages.
9. **`SEO-01`** — Search Console/Bing, index Products and Consultation, analytics
   and sharing decision.
10. **`AFFILIATE-01`** — configure, test and refund one referred purchase.

**Parallel product workstream:** `CAREER-PDF-01` is the new **Soft Life Career
Compass** PDF. The interior, data audit and build are done. It does not block
the P0 launch gate, but do not list it for sale until the Selar delivery and
order-bump path are tested.

## SELAR-01 — Selar checkout and live purchase

**File:** `01-selar-checkout.md`  
**Outstanding:** Selar product, checkout URL, webhook connection, live purchase,
duplicate delivery, buyer-claim and refund test.  
**Need from you:** confirmation of the selling account, payout/currency/tax
setup, product URL, webhook capability or secret reference, approval to make a
real test purchase, and confirmation after the refund.

1. Confirm the Selar business account, payout details, currency and tax handling.
2. Create **The Soft Life System — Complete bundle** at **$19.99 founding /
   $29.99 regular** with the eBook, all 15 audio chapters and worksheets.
3. Add the refund/terms links and set success/cancel redirects to the checkout
   page.
4. Put the public product URL and webhook details in `SELAR-01.md`, then say
   `Pick up SELAR-01`.
5. opencode updates `CHECKOUT_URL`, deploys, and verifies `/api/config`, the
   checkout button and `?ref=` append.
6. Configure the Selar webhook to the Worker endpoint with the secret reference.
7. opencode verifies the webhook contract, then you complete one small real
   purchase.
8. opencode verifies the tier upgrade, chapter 15 access and admin purchase row.
9. opencode verifies duplicate delivery is idempotent and pre-purchase signup
   claims the tier.
10. You refund the purchase; opencode verifies/manual-downgrades and deletes the
    test records.

**Done when:** a real buyer pays, lands back in the app, gets complete access, the
admin sees the purchase, duplicates are ignored, and a refund can lock access.

## LEGAL-01 — Legal, business and compliance

**File:** `02-legal-and-compliance.md`  
**Outstanding:** seller identity, jurisdiction, tax/refund decisions, counsel
review, WhatsApp messaging review, removal of the public draft note.  
**Need from you:** confirmed legal entity details, target markets/jurisdiction,
counsel feedback, and the approved refund window.

1. Fill the legal entity, operator, address, tax/VAT and contact facts in
   `LEGAL-01.md`.
2. Add the target markets and the refund/cancellation position.
3. Send the live Privacy, Terms and Refund pages to counsel.
4. Put counsel's requested changes or approval in the secure input and say
   `Pick up LEGAL-01`.
5. opencode updates `tools/build_blog.py`, regenerates the legal pages,
   OpenAPI/feeds if needed, deploys, and verifies the live pages.
6. You confirm the final business identity and refund wording.
7. opencode removes the public draft/counsel note, records the review date and
   version, and updates the checklists.

**Done when:** all three policies are approved for the actual seller and markets,
buyer-facing claims are safe, and the draft note is gone.

## CLOUDFLARE-01 — Secrets, admin and backups

**File:** `03-cloudflare-secrets-and-admin.md`  
**Outstanding:** move secrets and backups off-machine, enable Cloudflare Access,
complete the remaining CSP/rate-limit/email-verification hardening and decide
WAF. Migration `003` and the `v9`/`v10`/`v16`/`v17` releases are live; `v17` was deployed on 2026-11-15.  
**Need from you:** confirmation that secrets/backups are stored securely, the
Cloudflare Access setup or decision, the 2FA/account-member/token audit result,
and approval for CSP/rate limits/email verification.

1. Open `/tmp/softlife-secrets.json` once and store both values in a password
   manager.
2. Put only a reference such as "stored in password manager entry X" in
   `CLOUDFLARE-01.md`; do not paste the values.
3. Move all three D1 backups off-machine and record the storage reference.
4. Delete `/tmp/softlife-secrets.json` and the `/tmp` backup copies.
5. Confirm Cloudflare 2FA, account members, API-token scope and admin privacy.
6. Enable Cloudflare Access for `/api/admin/*` (free up to 50 users) and keep the
   admin password as a second factor. If Access is not possible, add Turnstile or
   rate limiting to admin login and record the accepted risk.
7. Apply migration `003-session-and-audio-tokens.sql`; existing member sessions
   are dropped, so every device must sign in again. **Done 2026-11-14.**
8. Deploy `softlife-v9`; confirm the footer has no Admin link, the service worker
   is current, audio uses `?token=` and a member session survives a reload. **Done
   2026-11-14.**
9. Complete the remaining security fixes from `03` sections G/H: CSP, session
   rotation/sign-out-all, auth rate limits and email verification.
10. Say `Pick up CLOUDFLARE-01`; opencode verifies secret names without printing
    values, checks the admin/session behaviour, and updates the board.
11. If the token is narrowed or rotated, update Selar and redeploy only after the
    new values work.

**Done when:** secrets and backups live only in secure storage, `/tmp` copies are
deleted, admin API access is behind Access or a documented risk acceptance, and
the remaining hardening work is scheduled. **`softlife-v17` is already live;
Worker version `49387315-e2ec-4ae3-95ab-12ec35782c93`.**

## EMAIL-01 — Email and support

**File:** `04-email-and-support.md`  
**Outstanding:** inbox monitoring, SPF/DKIM/DMARC, support-stack setup,
manual-vs-transactional email decision, buyer templates, password-reset process.  
**Need from you:** inbox access/confirmation, DNS authentication results, chosen
email option, Selar support-channel setup, and approval for any provider token.

1. Confirm `admin@gabochie.com` receives and sends externally and is monitored.
   Add a `support@gabochie.com` alias if the mailbox provider allows it.
2. Check MX, SPF, DKIM and DMARC; record any failures.
3. Adopt the zero-cost stack: monitored inbox + Selar **Contact seller** chat +
   in-app Help/FAQ + templates. Do not add a ticket system for the test group.
4. Decide manual support or a transactional provider for the test launch.
5. If using a provider, put the provider name and token reference in
   `EMAIL-01.md`; opencode adds the secret and requests/verifies the code changes.
6. Configure the Selar store support channel and add the Help/FAQ page.
7. Write the access, refund, audio-troubleshooting, password-reset and
   data-deletion templates.
8. Say `Pick up EMAIL-01`; opencode checks what is connected, tests any
   integration, and updates the checklists.
9. Send test messages to Gmail and Outlook and confirm inbox placement.

**Done when:** buyers know whether to contact Selar or the seller, support is
monitored, the password-reset decision works for the test group, and no secret is
emailed.

## QA-01 — Manual product QA

**File:** `05-product-qa.md`  
**Outstanding:** real purchase/refund, real iOS/Android devices, browser matrix,
keyboard/screen-reader pass, final pre-invite smoke test.  
**Need from you:** test card/payment approval, real devices, and results or
screenshots of any failure.

1. Finish `SELAR-01` and `CLOUDFLARE-01` first.
2. Run the real purchase/refund flow and record the order ID.
3. Test free/complete audio, PWA install, mobile widths and browser matrix.
4. Run the keyboard and screen-reader pass.
5. Put failures, device names and reproduction steps in `QA-01.md`.
6. Say `Pick up QA-01`; opencode fixes code issues, redeploys, re-runs automated
   checks and updates the test record.
7. Clean up the test purchase/member and run the final smoke test before inviting
   buyers.

**Done when:** a real buyer can pay and access the product, the primary phone
passes, no blocking accessibility issue remains, and the smoke test is clean.

## SEO-01 — SEO, analytics and launch operations

**File:** `06-seo-analytics-and-launch.md`  
**Outstanding:** Search Console/Bing, rich-result validation, OG previews,
analytics decision, native-share decision, launch tracking sheet, monitoring
ownership.  
**Need from you:** search-console access or verification results, social-preview
results, analytics choice/provider, social-share choice, and the monitoring owner.

1. Add and verify the domain in Google Search Console and Bing Webmaster Tools.
2. Submit the sitemap and request indexing.
3. Validate structured data and test OG previews in the external debuggers.
4. Choose no analytics, cookieless analytics or full analytics with consent.
5. If analytics is chosen, put the provider/token reference in `SEO-01.md`.
6. Create UTM links and the launch tracking sheet.
7. Decide whether to add native share buttons. Current app has OG/Twitter previews
   and an affiliate Copy link only; there is no `navigator.share` UI.
8. If sharing is approved, add mobile share-sheet support with copy/WhatsApp/X
   fallbacks and test on desktop and mobile.
9. Say `Pick up SEO-01`; opencode verifies metadata/discovery files, updates
   config or privacy text if needed, and records the tracking setup.

**Done when:** search engines can index the site, previews are correct, the
analytics/consent decision is implemented, the share decision is recorded, and
monitoring has an owner.

## DELIVERABLES-01 — Book and buyer deliverables

**File:** `07-product-deliverables.md`  
**Outstanding:** placeholders, final editorial pass, cover, EPUB/PDF verification,
Selar upload and buyer package test.  
**Need from you:** final author/publisher/ISBN/copyright facts, cover decision,
file approvals, and confirmation of the Selar upload.

1. Resolve every customisation placeholder and keep only intentional worksheet
   prompts.
2. Complete the line edit, copyright, permissions and chapter cross-check.
3. Finalise the cover at 1600 × 2400 and build the EPUB/PDF outputs.
4. Open the EPUB/PDF on iOS, Android and desktop; record failures.
5. Upload the final files to Selar and confirm the product lists them correctly.
6. Say `Pick up DELIVERABLES-01`; opencode checks metadata, placeholders, file
   naming, chapter/audio alignment and buyer instructions.
7. Run a buyer-package download test from the Selar receipt.

**Done when:** no unintended placeholder remains, the cover/metadata match the
seller, every buyer can download the files, and the book/audio/app chapters align.

## AFFILIATE-01 — Affiliate program

**File:** `08-affiliate-program.md`  
**Outstanding:** commission policy, Selar affiliate configuration, attribution,
real referral purchase and refund reversal.  
**Need from you:** the 30%/launch-partner decision, commission basis, payout
schedule, and approval to run one real referred purchase.

1. Confirm 30% standard commission and whether any launch-partner rate exists.
2. Confirm refund treatment, payout schedule and disclosure requirements.
3. Configure the Selar affiliate program at 30%.
4. Verify `?ref=CODE` capture and the checkout ref append.
5. Run one small referred purchase and confirm Selar records the commission.
6. Refund it and confirm the commission reverses.
7. Say `Pick up AFFILIATE-01`; opencode verifies copy/API parity, cleans up the
   test referral and updates the checklists.

**Done when:** Selar pays the stated 30% on a real referral, refunds reverse it,
and no public copy promises an unsupported rate.

## WHATSAPP-01 — WhatsApp community and consent

**File:** `09-onboarding-and-whatsapp-consent.md`  
**Outstanding:** choose Community vs group, create invite/rules, run one internal
consent test, export only consented contacts and document withdrawal handling.  
**Need from you:** the community decision, invite-link storage reference, rules,
and the result of the internal test.

1. Choose a WhatsApp Community (preferred) or group.
2. Create the invite link and store it in a password manager, not the repo.
3. Write rules: respect, no spam, no unsolicited DMs, no income guarantees, how
   to leave.
4. Run one internal opt-in with a test number through the app.
5. Export the consent CSV and confirm it contains only that opted-in contact.
6. Withdraw consent in the app and confirm the number is cleared and the next
   export drops the contact.
7. Put the link reference, rules and test result in `WHATSAPP-01.md`, then say
   `Pick up WHATSAPP-01`.
8. opencode verifies the data/CSV/withdrawal path, updates the docs, and confirms
   no non-consenting contact is included.

**Done when:** the community/rules exist, one internal consent test passes, the
export is opt-in only, withdrawal works, and no buyer is added without consent.

## PAGES-01 — Products and consultation pages

**File:** `10-extra-pages.md`  
**Outstanding:** finalise PDF toolkit names/prices, create the Selar consultation
product/payment link, replace the mailto CTA and test both pages. The offer
ladder, audit price, first-five capacity and guarantee are approved.  
**Need from you:** PDF titles and prices, booking method and Selar links.

1. Offer approved 2026-11-14: Complete bundle $19.99/$29.99; audit $99 for the
   first five, then $197; guarantee approved.
2. Review `/products/` and `/consultation/` on desktop and mobile.
3. Decide the first 1–3 PDF toolkits, their prices and release order. Do not add
   them to the page until the file and checkout exist.
4. Create the Selar consultation product or payment link and a booking path.
5. Put the approved details and links in `PAGES-01.md`, then say
   `Pick up PAGES-01`.
6. opencode replaces the application mailto with the approved checkout/booking
   CTA, updates capacity copy, rebuilds and redeploys.
7. Run the purchase/application tests and update the sitemap/indexing record.

**Done when:** every buy/apply button has a working destination, no unreleased
PDF is for sale, and both pages pass QA. Offer approval is complete.

## Pickup log

| Pick | Date | Result | Files updated |
| --- | --- | --- | --- |
| `CLOUDFLARE-01` | 2026-11-14 | Removed footer Admin link; added hashed 30-day sessions and short-lived audio tokens; 29 local tests pass; migration 003 and v9 live; Access/CSP/rate limits pending | `app/js/*`, `server/api.py`, `tests/test_api.py`, migration `003`, `03`, `05`, `06`, `09`, `README` |
| `PAGES-01` | 2026-11-14 | Built static `/products/` and `/consultation/` pages; added nav/footer, sitemap, llms links, Product/Service schema and SW v10; offer approved and previewed; Selar/booking pending | `app/products/index.html`, `app/consultation/index.html`, `app/index.html`, `app/js/app.js`, `app/sw.js`, `tools/build_blog.py`, `10-extra-pages.md`, `00`, `05`, `06`, `README` |
| `CAREER-PDF-01` | 2026-11-14 | Built 57-page Career Compass interior with 24 BLS-matched profiles, five data visuals, claims audit, worksheets and 90-day plan; added listing copy and Selar upload/bump steps; cover and delivery test pending | `12-products/PDF-PRODUCT-TEMPLATE.md`, `12-products/soft-life-career-compass/`, `01-selar-checkout.md`, `10-extra-pages.md`, `00` |
|  |  |  |  |

## Final launch gate

The P0 gate remains: do not invite test buyers until `SELAR-01`, `LEGAL-01`,
`CLOUDFLARE-01`, `EMAIL-01`, `QA-01`, `DELIVERABLES-01` and `WHATSAPP-01` are
checked. `PAGES-01`, `SEO-01` and `AFFILIATE-01` can run during the test
launch; the extra pages do not block the P0 gate.
