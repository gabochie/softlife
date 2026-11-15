# 01 — Selar Checkout and Webhook

**Priority:** P0 — test buyers cannot complete a purchase until this is done.

## Pickup card

- **Pick ID:** `SELAR-01`
- **Status:** Waiting on Selar
- **Outstanding:** product, checkout URL, webhook, live purchase and refund test.
- **Need from you:** account/payout confirmation, product URL, webhook secret reference, test-purchase approval.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/SELAR-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up SELAR-01`; full steps in `00-execution-board.md`.

The app's checkout page is built, but `CHECKOUT_URL` is empty. Buyers currently
see an email fallback instead of a payment page.

## A. Selar account and product

- [ ] Confirm the Selar account is the correct business account.
- [ ] Complete Selar payout/bank details.
- [ ] Confirm the selling currency and whether Selar handles tax/VAT for the target markets.
- [ ] Create the product: **The Soft Life System — Complete bundle**.
- [ ] Set the final price: **$19.99 founding**, **$29.99 regular**. Match the
  frontend copy and show both prices at checkout.
- [ ] Add the product description, cover image and deliverables:
  - eBook (PDF + EPUB)
  - All 15 read-aloud chapters
  - 90-day launch plan, worksheets and monthly review ritual
  - Updates we release to the app library
- [ ] Confirm the product type is digital and no shipping is required.
- [ ] Add the refund policy link: `https://soft.gabochie.com/legal/refund/`
- [ ] Add the terms link: `https://soft.gabochie.com/legal/terms/`
- [ ] Set the success redirect to: `https://soft.gabochie.com/#/checkout`
- [ ] Set the cancel redirect to: `https://soft.gabochie.com/#/checkout`
- [ ] Copy the public checkout/product URL.
- [ ] After the core product works, create the consultation product/payment link
  for **The Soft Life Business Audit** in `10-extra-pages.md`.
- [ ] Create PDF toolkit products only when each final file is ready; do not
  create pre-orders.

## B. Connect the checkout URL

- [ ] Edit `deploy/cloudflare/wrangler.toml`:
  ```toml
  CHECKOUT_URL = "https://selar.co/your-product"
  ```
- [ ] Deploy:
  ```bash
  cd /public/softlife/08-app/deploy/cloudflare
  sh build.sh
  npx wrangler@4.158.0 deploy --config wrangler.toml
  ```
- [ ] Confirm `https://soft.gabochie.com/api/config` returns the new `checkoutUrl`.
- [ ] Open `https://soft.gabochie.com/#/checkout` and confirm the button goes to Selar.
- [ ] Confirm a signed-in member's referral code is appended as `?ref=...` or `&ref=...`.

## C. Configure the webhook

- [ ] In Selar, create a webhook for successful purchases.
- [ ] Endpoint:
  ```text
  https://soft.gabochie.com/api/webhooks/purchase
  ```
- [ ] Authentication header:
  ```text
  Authorization: Bearer <PURCHASE_WEBHOOK_SECRET>
  ```
  Alternative accepted by the Worker:
  ```text
  X-Webhook-Secret: <PURCHASE_WEBHOOK_SECRET>
  ```
- [ ] Use the secret stored in `/tmp/softlife-secrets.json`, then move that file
  to a password manager and delete the `/tmp` copy.
- [ ] If Selar cannot send custom headers, stop and request a small Worker change
  for a signed query-token or Selar-specific signature. Do not put the raw secret
  in a URL if it can be avoided.
- [ ] Confirm Selar retries failed webhook deliveries.
- [ ] Confirm Selar's payload includes an order ID, buyer email, amount and currency.

The Worker currently accepts these common fields:

| Data | Accepted fields |
| --- | --- |
| Order ID | `order_id`, `orderId`, `reference`, `id`, `order.id` |
| Email | `email`, `customer_email`, `buyer_email`, `customer.email` |
| Tier | `tier` (defaults to `complete`) |
| Amount | `amount`, `total` |
| Currency | `currency` |
| Provider | `provider` (defaults to `selar`) |

If Selar uses different field names, update `worker.js` before the purchase test.

## D. Live purchase test

Use a real card and a small amount. This is the only way to test the real flow.

- [ ] Create the test member account first, or use a new email.
- [ ] Buy through the real Selar checkout.
- [ ] Confirm the success redirect reaches the app.
- [ ] Confirm the member's tier becomes `complete` in `/api/me`.
- [ ] Confirm the member can play chapter 15.
- [ ] Confirm the purchase appears in `#/admin` under Purchases.
- [ ] Confirm the order amount, currency and email are correct.
- [ ] Send the same webhook twice and confirm the second response contains
  `"duplicate": true` and no second purchase row is created.
- [ ] Sign up with a buyer email that paid before creating an account and confirm
  the new account is claimed as `complete`.
- [ ] Refund the test purchase in Selar.
- [ ] Manually downgrade the test member back to `free` in `#/admin`.
- [ ] Delete or clearly mark the test purchase and test member.

## E. Refund and support process

- [ ] Confirm the refund window. The live draft policy currently says 14 days.
- [ ] Write the exact refund steps for support.
- [ ] Confirm Selar's refund timing and whether it notifies the Worker.
- [ ] Decide whether refunds require a manual downgrade. The webhook currently
  handles purchases, not refunds.
- [ ] Confirm the support inbox receives Selar receipts and buyer replies.

## F. Career Compass product and order bump

This is a separate digital product. Selar delivers the PDF; the app does not
need a new member tier.

- [ ] Upload `12-products/soft-life-career-compass/dist/the-soft-life-career-compass.pdf`.
- [ ] Create the Selar product at **$19** with the final cover (1600 × 2400 px or
  larger), the listing copy in the product README, and the refund/terms links.
- [ ] Confirm Selar sends the PDF automatically after payment and the download
  link works on mobile.
- [ ] Add the product as a **$9 order bump** on the Complete bundle checkout, or
  create a two-item bundle if Selar's bump feature is unavailable. Do not
  discount the core bundle to create the offer.
- [ ] Do not connect this product to the member webhook; it does not change the
  member tier. Selar owns delivery.
- [ ] Include the PDF manually with each Business Audit and record it in the
  client file.
- [ ] Run three tests: standalone $19 purchase, Complete + $9 bump, and refund.
  Confirm the buyer receives the correct files in each case.
- [ ] List the product on `/products/` only after all three tests pass.

**Acceptance:** a standalone buyer and a bump buyer both receive the PDF, the
Complete buyer still gets the app tier, and a refund does not leave a paid
entitlement behind.

## Acceptance criteria

- A real test buyer can pay, land back in the app, and immediately access all 15
  chapters.
- The admin dashboard shows the purchase.
- Duplicate webhook delivery is idempotent.
- A refund can be processed without leaving the account permanently unlocked.
- No secret is stored in the repository, a URL, or a task file.

## Current status

- [x] Checkout page built with email fallback.
- [x] Frontend copy updated to $19.99 founding / $29.99 regular, 30% affiliate
  and access-while-operated.
- [x] Frontend copy update deployed to production on 2026-11-14.
- [x] Purchase webhook endpoint, auth and dedupe built.
- [x] Admin tier upgrade and purchase list built.
- [ ] Real Selar product URL connected.
- [ ] Real Selar webhook configured.
- [ ] Live purchase, duplicate-delivery and refund tests completed.
- [ ] Career Compass PDF uploaded to Selar.
- [ ] Career Compass standalone, $9 bump, and refund tests completed.
