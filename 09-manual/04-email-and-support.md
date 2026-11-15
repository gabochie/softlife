# 04 — Email and Support

**Priority:** P0 for support; P1 for full automation.

## Pickup card

- **Pick ID:** `EMAIL-01`
- **Status:** Waiting
- **Outstanding:** inbox monitoring, SPF/DKIM/DMARC, email option, buyer templates and reset process.
- **Need from you:** inbox confirmation, DNS results, chosen email option and any provider token reference.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/EMAIL-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up EMAIL-01`; full steps in `00-execution-board.md`.

The app currently has no transactional email service, no email verification and
no password-reset flow. Selar can send receipts, but the app itself does not
send welcome, access or reset emails.

## Support model

Selar handles platform/payment/receipt questions and can show a **Contact
seller** chat widget if a store support channel is configured. Selar does not
provide support for the book content, app access, audio, refunds or account
issues; those stay with the seller.

For the test launch, do **not** build a ticket system. Use a zero-cost stack:

1. `admin@gabochie.com` as the single support inbox, with labels and templates.
2. Selar store support channel enabled so buyers can reach the seller.
3. A short in-app Help/FAQ page covering sign-in, access, audio, download, PWA
   install, refunds and data deletion.
4. WhatsApp community for peer discussion, not private account support.
5. If volume grows, add a D1-backed contact form visible in admin or a free
   helpdesk; do not add paid software for the first test group.

Define one response-time expectation (for example, one business day) and keep
the test group small enough to meet it.

## A. Support inbox

- [ ] Confirm `admin@gabochie.com` exists and can receive mail.
- [ ] Confirm it is monitored during the test launch.
- [ ] Send a test email from an external account and confirm delivery.
- [ ] Confirm replies from the inbox reach external recipients (not spam).
- [ ] Add a short auto-reply with expected response time.
- [ ] Confirm the same address is used consistently on the site, legal pages,
  security.txt, Selar and receipts.
- [ ] Create folders/labels for buyers, refunds, access problems and privacy requests.

## B. Email authentication

If `admin@gabochie.com` is hosted on the custom domain, confirm:

- [ ] MX records are correct.
- [ ] SPF includes the sending provider and does not exceed the DNS lookup limit.
- [ ] DKIM is configured and passing.
- [ ] DMARC is published and monitored.
- [ ] Test messages pass authentication when sent to Gmail and Outlook.
- [ ] The domain is not on a blocklist.

If email is hosted elsewhere, verify authentication for that domain.

## C. Test-launch email decision

Choose one before inviting buyers.

### Option 1 — Manual for the test launch

- [ ] Selar sends the receipt.
- [ ] You personally send access instructions after each test purchase.
- [ ] Refund and access problems are handled manually.
- [ ] Password resets are handled by a documented manual process.
- [ ] Keep the test group small enough to support manually.

### Option 2 — Add transactional email before the test

- [ ] Choose a provider (for example Resend, Postmark, Brevo or your email
  platform).
- [ ] Verify the sending domain.
- [ ] Add the provider credentials to Cloudflare secrets, never to the repo.
- [ ] Add or request code for welcome, purchase/access and password-reset emails.
- [ ] Test deliverability and links.

Do not put passwords in email. Use a one-time reset link or a secure manual
verification process.

## D. Buyer onboarding

- [ ] Write the access email: where to sign in, how to install the PWA, how to
  play audio, and who to contact.
- [ ] Confirm a buyer can create an account with the same email used at checkout.
- [ ] Confirm a buyer who signs up after paying is automatically upgraded.
- [ ] Confirm the buyer knows the purchase is tied to the checkout email.
- [ ] Write a refund acknowledgement template.
- [ ] Write a "can't access audio" troubleshooting template.
- [ ] Write a "forgot password" template and decide the recovery process.
- [ ] Write a privacy/data-deletion request template.
- [ ] Write a Business Audit application reply: fit, price, payment link,
  booking options and what happens if it is not a fit.
- [ ] Write a toolkit-release reply for people who ask when the PDFs ship.

## E. Marketing email and consent

Only needed if a newsletter or lead magnet is added.

- [ ] Add explicit consent at signup.
- [ ] Add an unsubscribe link to every marketing email.
- [ ] Keep consent records.
- [ ] Update the Privacy Policy with the email provider and purpose.
- [ ] Do not add buyers to a marketing list without consent.
- [ ] Test the welcome sequence before the test launch.

## F. Deliverability test

- [ ] Send to Gmail, Outlook and one mobile mail app.
- [ ] Confirm inbox placement, links and formatting.
- [ ] Check spam score.
- [ ] Confirm the Selar receipt link opens the app correctly on mobile.
- [ ] Confirm support replies are not threaded into spam.

## Acceptance criteria

- Buyers know whether to contact Selar (payment) or the seller (product/access).
- A buyer receives clear access instructions and can get help.
- Support email is monitored and authenticated.
- The password-reset decision is documented and workable for the test group.
- No password or secret is sent by email.
- Marketing email, if used, has consent and unsubscribe handling.

## Current status

- [x] `SUPPORT_EMAIL` is set to `admin@gabochie.com`.
- [x] Support links are visible on the site and legal pages.
- [ ] Inbox monitoring and delivery confirmed.
- [ ] SPF/DKIM/DMARC confirmed.
- [ ] Test-launch email option chosen.
- [ ] Buyer onboarding templates written.
- [ ] Password-reset process decided.
