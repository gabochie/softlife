# 05 — Manual Product QA

**Priority:** P0 — run this after Selar, legal and secrets are ready.

## Pickup card

- **Pick ID:** `QA-01`
- **Status:** Blocked on Selar
- **Outstanding:** real purchase/refund, real devices, browser matrix, accessibility pass and final smoke test.
- **Need from you:** test-payment approval, devices and failure details or screenshots.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/QA-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up QA-01`; full steps in `00-execution-board.md`.

Automated checks already pass: SEO/discovery files, security headers, admin API,
onboarding/consent, admin audience CSV, purchase webhook, audio gating/range/416,
axe accessibility scans, mobile overflow and service-worker cache. This file
covers what automation cannot prove: real purchases, real devices, browser
behaviour and human judgement.

## A. Preconditions

- [ ] Selar product and webhook are configured.
- [ ] `CHECKOUT_URL` is set and deployed.
- [ ] Secrets are stored and `/tmp/softlife-secrets.json` is deleted.
- [x] D1 backup exported.
- [ ] Test buyer email is available.
- [ ] Test card or payment method is available.
- [ ] You can access the admin dashboard.
- [ ] You know how to refund the test purchase.

## B. Account and access flow

Onboarding/consent subset verified in a production browser on 2026-11-14.

- [ ] Open the site in a private window with `?utm_source=qa&utm_campaign=consent`.
- [x] Create a new account and confirm it lands on the onboarding form.
- [ ] Confirm onboarding can be skipped and the dashboard still works.
- [ ] Complete the profile and confirm the dashboard prompt disappears.
- [x] Confirm the saved profile appears on the account page.
- [x] Confirm the WhatsApp consent box is unchecked by default.
- [x] Tick consent with a test number and confirm it saves.
- [x] Untick consent and confirm the number is cleared and the account says **Not joined**.
- [x] Confirm consent without a valid number is rejected.
- [x] Confirm the free tier can play the intro and chapter 1.
- [x] Confirm chapter 2 and chapter 15 are locked for free users.
- [ ] Sign out and sign back in.
- [ ] Confirm the demo account still works.
- [ ] Try a wrong password and confirm a clear error.
- [ ] Try a duplicate signup email and confirm a clear error.
- [ ] Confirm the account survives a page reload and a new browser session.
- [ ] Confirm logout clears the member session.

## C. Checkout and purchase

Complete a real purchase with a small amount.

- [ ] Click the checkout button and confirm it opens the Selar page.
- [ ] Confirm the app and Selar both show **$19.99 founding** and **$29.99 regular**.
- [ ] Confirm the Selar price, currency and product description are correct.
- [ ] Confirm the refund and terms links work from Selar.
- [ ] Complete payment.
- [ ] Confirm the success redirect returns to the app.
- [ ] Confirm the buyer account becomes `complete`.
- [ ] Confirm all 15 chapters unlock.
- [ ] Confirm the purchase appears in the admin dashboard.
- [x] Confirm the admin audience card shows the profile and WhatsApp opt-in.
- [x] Export consenting contacts and confirm the CSV contains only opted-in people.
- [ ] Confirm the receipt email arrives and the access link works.
- [ ] Duplicate the webhook once and confirm no duplicate purchase is created.
- [ ] Refund the purchase and manually downgrade the test account.
- [ ] Confirm chapter 15 locks again after downgrade.
- [ ] Clean up the test purchase and test account.

## D. Audio

Test on desktop and at least one real phone.

- [ ] Play `intro`.
- [ ] Play `ch01` as a free user.
- [ ] Confirm `ch02` is unavailable as a free user.
- [ ] Unlock complete and play `ch15`.
- [ ] Pause, resume and seek.
- [ ] Seek near the end and near the start.
- [ ] Confirm the duration and chapter labels are correct.
- [ ] Confirm playback survives a screen lock/lock-screen test on mobile.
- [ ] Confirm the audio respects the phone's silent/volume state.
- [ ] Confirm a bad range request fails cleanly rather than hanging.
- [ ] Confirm there is no exposed direct audio link for locked chapters.

## E. Mobile and PWA

Test at 320 px, 375 px, 390 px and 414 px widths.

- [ ] No horizontal scrolling.
- [ ] Header, menu, hero, cards and footer fit.
- [ ] Checkout and signup forms are usable with the keyboard open.
- [ ] Tap targets are large enough.
- [ ] Install the PWA on Android.
- [ ] Add to Home Screen on iPhone/iPad.
- [ ] Launch from the home screen and confirm the app opens correctly.
- [ ] Confirm the offline shell appears instead of a browser error.
- [ ] Confirm a new deployment updates the service worker without stale HTML.
- [ ] Confirm the app still works after clearing site data.

## F. Browser matrix

- [ ] Chrome desktop.
- [ ] Safari desktop, if available.
- [ ] Firefox desktop.
- [ ] Chrome on Android.
- [ ] Safari on iOS.
- [ ] Samsung Internet, if available.
- [ ] Confirm no console errors during signup, checkout, audio and admin use.
- [ ] Confirm password managers/autofill work on sign-in.

## G. Accessibility

Automated axe scans are already clean; this is the human pass.

- [ ] Navigate the signup, checkout, blog and admin login with the keyboard only.
- [ ] Confirm focus is always visible.
- [ ] Confirm the mobile menu can be opened and closed by keyboard.
- [ ] Test with a screen reader on at least one platform.
- [ ] Confirm audio controls have names and announced state.
- [ ] Confirm error messages are announced or reachable.
- [ ] Confirm reduced-motion preference is respected.
- [ ] Confirm text remains readable at 200% zoom.
- [ ] Confirm colour is not the only way status is communicated.

## H. Content and navigation

- [ ] Open every main navigation link.
- [ ] Open all 5 blog posts.
- [ ] Open the blog Markdown variants.
- [ ] Open all three legal pages.
- [ ] Open the sitemap, robots, llms and OpenAPI files.
- [ ] Confirm the footer links work.
- [ ] Confirm the 404 page appears for an unknown route.
- [ ] Confirm no placeholder text or lorem ipsum remains.
- [ ] Confirm the checkout copy matches the Selar product and refund policy.
- [ ] Confirm the checkout says access is while the service operates and includes
  updates we release, not "lifetime access".
- [ ] Confirm the affiliate page says **30%** and no copy promises 50%, "free
  forever" or "monthly reviews".
- [ ] Open `/products/` and `/consultation/` from the home page, app nav and footer.
- [ ] Confirm both static pages load with JavaScript disabled.
- [ ] Confirm the Products page does not list an unreleased PDF as available.
- [ ] Confirm every Complete bundle button reaches `/#/checkout`.
- [ ] Apply through the consultation email CTA and confirm the message arrives
  with the pre-filled subject and body.
- [ ] Confirm the consultation price, first-five limit and guarantee match the
  approved offer.
- [ ] Confirm no page promises income, clients or a specific business result.

## I. Performance and resilience

- [ ] Load the home page on a throttled mobile connection.
- [ ] Confirm the hero and primary CTA are usable before all images load.
- [ ] Confirm audio starts without a long unexplained delay.
- [ ] Confirm API errors show a useful message, not a blank screen.
- [ ] Confirm the app handles a lost connection during signup or checkout.
- [ ] Confirm a refresh during checkout does not corrupt the account.
- [ ] Confirm Cloudflare logs show no unexpected errors during the pass.

## J. Final smoke test

Run once more immediately before inviting testers:

- [ ] Home loads.
- [ ] Signup works.
- [ ] Sign-in works.
- [ ] Free audio works.
- [ ] Complete audio works.
- [ ] Checkout opens Selar.
- [ ] Test purchase upgrades the account.
- [ ] Admin sees the purchase.
- [ ] Refund/manual downgrade works.
- [ ] Blog and legal pages load.
- [ ] Mobile layout has no overflow.
- [ ] Service worker is current.

## K. Security and admin smoke

- [x] Confirm the footer has no Admin link and no other public admin link.
  Verified in production on 2026-11-14.
- [ ] Confirm `/#/admin` is usable by the owner but admin data is not exposed
  without the admin session.
- [ ] If Cloudflare Access is enabled, confirm `/api/admin/*` is blocked without
  an Access identity and works from the allowed identity.
- [x] Confirm no admin password, member token or webhook secret appears in the
  production JS bundle. Verified 2026-11-14.
- [ ] Confirm a wrong admin password is rejected and logout invalidates the session.
- [ ] If a CSP is added, confirm it does not break signup, checkout, audio or admin.
- [x] Confirm audio URLs contain only `?token=` with a short-lived audio token;
  the member session token is rejected in the query string. Verified in production.
- [x] After the session change deploys, confirm existing sessions are cleared,
  then sign-in works and the session lasts across a reload. Verified in production.

## Test record

| Date | Tester | Device/browser | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-11-14 | Automated | Chromium desktop | Pass | Production signup, onboarding, consent withdrawal, admin CSV |
| 2026-11-14 | Automated | Local API | Pass | 29 tests; session/audio tokens hashed and expiring; extra pages static/discoverable |
| 2026-11-14 | Automated | Production API | Pass | v9 deploy; sign-in, audio token, free gate, raw-token rejection, signout, headers, 416 |
| 2026-11-14 | Automated | Chromium desktop/mobile | Pass | v10; Products/Consultation 200, no console errors, no overflow, CTAs correct, SW v10 |
| 2026-11-15 | Automated | Chromium desktop/mobile | Pass | Local v11; main logo/hero load, responsive square hero selected, 29 tests, cover PDF 57 pages/full-bleed |
| 2026-11-15 | Automated | Chromium desktop/mobile | Pass | Local v12; compact lotus header, one global footer on 13 pages, responsive CTAs, no overflow, 29 tests |
| 2026-11-15 | Automated | Chromium desktop/mobile | Pass | Local v13; original logo on cream footer plate, compact lotus header, one global footer on 13 pages, no overflow |
| 2026-11-15 | Automated | Chromium desktop/mobile | Pass | Local v14; full-logo header plate, original logo on cream footer plate, 14 pages with global footer, /contact/ live, 30 internal links 200, no overflow |
| 2026-11-15 | Automated | Chromium desktop/mobile | Pass | Local v15; social links added site-wide, legacy #/legal redirects removed, one canonical refund page, 29 tests |
|  |  |  |  |  |
|  |  |  |  |  |

## Acceptance criteria

- A real buyer can pay and immediately access the full product.
- The free/complete gate works on real devices.
- No blocking layout, audio or PWA issue remains on the primary phone.
- No console or server errors during the smoke test.
- Test data is cleaned up afterward.

## Current status

- [x] Automated API, audio, onboarding/consent, admin CSV, SEO, header, axe and overflow checks pass.
- [x] Mobile and desktop layout checked at common widths.
- [x] Production service worker `softlife-v9` verified after the 2026-11-14 deploy.
- [x] Static `/products/` and `/consultation/` pages built, deployed and verified in
  production; service worker is `softlife-v10`.
- [x] Onboarding, consent withdrawal and admin consent export verified in production.
- [x] Local API suite passes 29 tests, including session/audio token hardening and
  static page delivery.
- [x] Migration `003`, `softlife-v9` and forced re-login verified in production.
- [x] Footer Admin link removal verified in production.
- [ ] Admin Access/security smoke completed.
- [ ] Real Selar purchase test completed.
- [ ] Real iOS/Android device pass completed.
- [ ] Manual keyboard/screen-reader pass completed.
- [ ] Final pre-invite smoke test completed.
