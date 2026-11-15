# 03 — Cloudflare, Secrets, Admin and Backups

**Priority:** P0 — do this before sharing the admin link or inviting test buyers.

## Pickup card

- **Pick ID:** `CLOUDFLARE-01`
- **Status:** Partial
- **Outstanding:** move secrets/backups out of `/tmp`, enable Cloudflare Access,
  add the remaining CSP/rate-limit/email-verification hardening and schedule an
  independent audit. The v9/v10 deploy, session/audio and extra-page fixes are
  live.
- **Need from you:** secure-storage confirmation, Access setup/decision,
  2FA/token audit result and approval for the CSP/rate-limit/email-verification
  fixes.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/CLOUDFLARE-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up CLOUDFLARE-01`; full steps in `00-execution-board.md`.

## A. Preserve the generated secrets

The admin password and purchase webhook secret were generated during deployment.
The only copy is:

```text
/tmp/softlife-secrets.json
```

- [ ] Open the file once and store both values in a password manager.
- [ ] Confirm the admin password is strong and unique.
- [ ] Confirm the webhook secret matches the value configured in Selar.
- [ ] Delete `/tmp/softlife-secrets.json` after storing the values.
- [ ] Never commit the file or paste the values into this directory.
- [ ] Confirm `wrangler.toml` contains no secret values. It should only contain
  non-secret vars such as `SITE_URL`, `CHECKOUT_URL`, `SUPPORT_EMAIL` and
  `ADMIN_SESSION_HOURS`.

Verify the secret names without printing their values:

```bash
cd /public/softlife/08-app/deploy/cloudflare
npx wrangler@4.158.0 secret list --config wrangler.toml
```

Expected names:

- `ADMIN_PASSWORD`
- `PURCHASE_WEBHOOK_SECRET`

If a value is lost, rotate it with:

```bash
npx wrangler@4.158.0 secret put ADMIN_PASSWORD --config wrangler.toml
npx wrangler@4.158.0 secret put PURCHASE_WEBHOOK_SECRET --config wrangler.toml
```

After rotating `PURCHASE_WEBHOOK_SECRET`, update Selar before testing again.

## B. Admin access

- [x] Sign in at `https://soft.gabochie.com/#/admin` with the stored password.
- [x] Confirm the dashboard, users, purchases, referrals, audience and audio views load.
- [x] Confirm the audience card shows profile completion and WhatsApp opt-ins.
- [x] Confirm the consent CSV export is opt-in only.
- [ ] Confirm logout immediately invalidates the session.
- [x] Confirm a wrong password is rejected.
- [ ] Confirm the session expires after approximately 12 hours.
- [x] Remove the public **Admin** link from the SPA footer. Source and the local
  build are updated; production serves the old bundle until the next deploy.
  The route remains reachable only by direct `/#/admin` URL.
- [ ] Deploy the footer removal and confirm the new service-worker version is
  live. Bump `app/sw.js` when changing cached assets.
- [ ] **Recommended access control:** put `/api/admin/*` behind Cloudflare
  Access (Zero Trust free plan, up to 50 users) using email OTP or Google.
  Keep the separate admin password as a second factor. Verify login, admin API
  calls, CSV export and logout from the allowed identity and from a blocked one.
- [ ] If Access is not enabled, add a rate limit and/or Turnstile challenge to
  `/api/admin/login`. The current 400 ms delay is not brute-force protection.
- [ ] Move the admin UI to a separate protected hostname or `/ops` path only if
  needed; hiding a public hash route is not an access-control measure.
- [ ] Confirm the Cloudflare account has 2FA enabled.
- [ ] Remove unused Cloudflare account members and audit API tokens.
- [ ] Review the Wrangler OAuth token scope. The current token has broad write
  access to Workers, D1, KV, routes, Pages and related services, which is more
  than a minimum deploy token. Consider a narrower token before public launch.

## C. Deployment and configuration

- [x] Confirm `SITE_URL = "https://soft.gabochie.com"`.
- [x] Confirm `SUPPORT_EMAIL = "admin@gabochie.com"`.
- [x] Confirm `ADMIN_SESSION_HOURS = "12"`.
- [ ] Confirm `CHECKOUT_URL` is set after completing `01-selar-checkout.md`.
- [ ] Confirm the custom domain certificate is active.
- [x] Confirm `https://soft.gabochie.com` and
  `https://softlife.gideonabochie.workers.dev` both serve the current app.
- [x] Confirm `not_found_handling = "404-page"` still returns the branded 404.
- [x] Confirm the service worker version is current after the final deploy.
  Production is `softlife-v17`, deployed 2026-11-15 (Worker version
  `49387315-e2ec-4ae3-95ab-12ec35782c93`). `v16` added the cookie policy and
  public tab bar; `v17` adds the social/share UI and accessibility fixes. Bump
  again after each cached asset change.
- [x] Run the deploy from the correct directory. The current release was
  deployed on 2026-11-15:
  ```bash
  cd /public/softlife/08-app/deploy/cloudflare
  sh build.sh
  npx wrangler@4.158.0 deploy --config wrangler.toml
  ```

Deploy from `08-app` creates an accidental Worker. Always deploy from
`deploy/cloudflare`.

## D. Database and audio backups

Pre-migration, post-deploy and pre-`003` backups were taken on 2026-11-14.
They are still temporary, so move them off-machine before inviting buyers.

- [x] Export backups outside the deployed assets.
- [x] Confirm the exports contain the `softlife_users`, `softlife_purchases`,
  `softlife_referrals`, `softlife_onboarding`, `softlife_events` and
  `softlife_admin_sessions` tables.
- [x] Confirm the D1 backup was taken after the onboarding migration.
- [ ] Move all backups to encrypted or off-machine storage and remove the
  `/tmp` copies:
  - `/tmp/softlife-d1-backup-20261114T083121Z.sql`
  - `/tmp/softlife-d1-postdeploy-20261114T085014Z.sql`
  - `/tmp/softlife-d1-pre-003-20261114T1042Z.sql`
- [ ] Confirm the audio source files are backed up outside KV. KV currently has
  all 16 audio keys, but KV is not a backup system.
- [ ] Repeat the D1 export after the test launch.
- [ ] Do not store backups in `app/` or `public/`; they would be deployed.

## E. Monitoring and logs

- [x] Confirm Workers observability is enabled.
- [ ] Tail logs during the first test purchase:
  ```bash
  npx wrangler@4.158.0 tail softlife --config wrangler.toml
  ```
- [ ] Confirm there are no unhandled exceptions during signup, checkout,
  webhook, login or audio playback.
- [ ] Confirm Cloudflare email alerts or dashboard notifications are enabled for
  Worker errors.
- [ ] Decide who checks the dashboard during the test launch.

## F. Cloudflare robots and AI crawler policy

The custom domain currently receives a Cloudflare-managed robots.txt block,
followed by the app's aligned policy:

- Search crawlers: allowed.
- AI answer/search crawlers: allowed.
- Training-only crawlers: disallowed.

- [ ] Confirm this is the intended business decision.
- [ ] If training crawlers should be allowed, change it in the Cloudflare
  dashboard. This needs Bot Management/AI Crawl Control access, not the current
  Wrangler token.
- [ ] If keeping the current policy, no Cloudflare change is needed.
- [ ] Re-check `https://soft.gabochie.com/robots.txt` after any dashboard change.

## G. Security review notes

A quick code review on 2026-11-14 found these non-payment risks. This is not a
penetration test.

- No rate limiting or CAPTCHA on signup/signin/admin login. Admin login has only
  a 400 ms delay, so use Cloudflare Access and a long unique password.
- No `Content-Security-Policy` header. Add at least a report-only CSP before
  public launch, then test inline scripts and JSON-LD.
- Member sessions now expire after 30 days and are hashed at rest in the API
  and schema (`003-session-and-audio-tokens.sql`). The browser still keeps the
  raw session token in `localStorage`; add rotation and "sign out all devices".
- Audio URLs now use a separate short-lived (2-hour) audio token, not the member
  session token. The API rejects a session token in the query string.
- Admin is a single shared password with full control, no individual accounts or
  audit log. Acceptable for one operator; add identities/audit before staff.
- No email verification, while the purchase webhook upgrades existing accounts by
  email. A buyer's email can be pre-registered and later claimed when they pay.
- No self-service account deletion or data export; deletion is an email request.
  Document the manual process and response time, or add self-service controls.
- Good controls found: parameterised SQL, consistent `esc()` on rendered data,
  PBKDF2 password hashing, hashed admin tokens, no CORS wildcard, HSTS,
  frame-deny, nosniff, referrer policy and webhook secret comparison.
- Have an independent penetration test before meaningful scale, not necessarily
  before a small invited test if the P0 items above are addressed.

## H. Security-hardening checklist

- [x] Complete a quick code review of auth, admin, sessions, audio and webhook paths.
- [x] Deploy `softlife-v9` and confirm the footer Admin link is gone.
- [ ] Put `/api/admin/*` behind Cloudflare Access. If not, record the accepted risk
  and add Turnstile/rate limiting to `/api/admin/login`.
- [ ] Add a `Content-Security-Policy` in report-only mode, fix violations, then
  enforce it. Test the inline scripts and JSON-LD.
- [x] Member sessions expire after 30 days and are stored as hashes, not
  plaintext. Migration `003` and the matching Worker are live in production.
- [ ] Add session rotation and a "sign out all devices" action.
- [x] Replace `?t=` with a separate short-lived audio token; reject raw session
  tokens in audio query strings. Live in production and verified.
- [ ] Add rate limits and/or Turnstile to signup, signin and admin login.
- [ ] Add email verification, or stop the purchase webhook auto-upgrading
  accounts whose email has not been verified. Coordinate with `04`.
- [ ] Add self-service account deletion/data export, or document the manual
  request process and response target in the Privacy Policy.
- [x] Confirm HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy` and `Permissions-Policy` are present on HTML, API, audio and
  `416` responses.
- [x] Confirm `/api/config` does not expose secrets.
- [ ] Confirm the admin password and member session token are not visible in the
  app bundle, logs or query strings. Audio tokens may appear in audio URLs but
  must be scoped to audio and expire.
- [x] Confirm purchased audio is gated server-side, not only hidden in the UI.
- [x] Confirm invalid audio ranges still return `416`.
- [ ] Commission an independent penetration test/OWASP ASVS review before
  meaningful scale. Track remediation and retest.

## Acceptance criteria

- Secrets exist only in Cloudflare and a password manager.
- `/tmp/softlife-secrets.json` is deleted.
- Cloudflare account and admin access are secured, with Access or a documented
  risk acceptance.
- A D1 backup exists outside the project folder.
- High-priority security hardening is completed or has dated owners.
- Logs show no errors during the final test-launch smoke test.
- No secret is present in the repository, generated assets or task files.

## Current status

- [x] Secrets generated and set in Cloudflare.
- [x] Admin login, logout and session expiry built and tested.
- [x] Admin dashboard, audience table and consent CSV verified in production.
- [x] Observability enabled.
- [x] Security headers added to HTML, API, audio and `416` responses.
- [x] Cloudflare managed robots policy reviewed and aligned.
- [x] Quick security review completed on 2026-11-14; not a penetration test.
- [x] Public Admin link removed; `softlife-v9` deployed and production verified.
- [x] Session hashing/expiry and short-lived audio tokens implemented and live.
- [x] Local API suite passes 29 tests, including token hashing, expiry and the
  static extra pages.
- [x] D1 migration `003-session-and-audio-tokens.sql` applied; existing sessions cleared.
- [x] `softlife-v9` deployed and production service worker verified.
- [x] Production sign-in, audio token, free-tier gate, raw-token rejection and signout verified.
- [ ] Secrets moved to password manager and `/tmp` copy deleted.
- [x] D1 backups exported before migration, after deploy and before `003`; tables verified.
- [ ] Backups copied off-machine and removed from `/tmp`.
- [ ] Cloudflare Access enabled for `/api/admin/*` or risk accepted.
- [ ] CSP, session rotation/sign-out-all, rate-limit and email-verification fixes completed.
- [ ] Independent penetration test scheduled or completed.
