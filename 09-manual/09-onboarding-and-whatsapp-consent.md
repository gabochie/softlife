# 09 — Onboarding Data and WhatsApp Consent

**Priority:** P0 for the WhatsApp community workflow. The technical migration,
deployment and verification are complete.

The code captures optional business context, first-touch acquisition data and
explicit WhatsApp community consent. Sections B–D are complete. **Section E is the
remaining manual work.**

## Pickup card

- **Pick ID:** `WHATSAPP-01`
- **Status:** Ready
- **Outstanding:** community/group decision, invite/rules, one internal consent test and withdrawal check.
- **Need from you:** invite-link storage reference, rules and the internal test result; never send buyer data.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/WHATSAPP-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up WHATSAPP-01`; full steps in `00-execution-board.md`.

## A. What the app now stores

Per member, in `softlife_onboarding`:

- Business name, stage, country, timezone, main goal, biggest challenge,
  revenue range and team size.
- First-touch source, UTM tags and external referrer.
- WhatsApp number, consent state, consent timestamp and consent version.
- Email marketing consent state and timestamp.
- Profile completion timestamp.

Product events are stored in `softlife_events`: signup, signin, onboarding saved
or completed, consent granted or withdrawn, task added or completed, audio play
and checkout click. Events never store the WhatsApp number or password.

## B. Back up and migrate D1

This was the required deploy order: the tables had to exist before the new
Worker code went live. Completed 2026-11-14.

- [x] Export a fresh D1 backup using `03-cloudflare-secrets-and-admin.md`.
- [x] Apply the migration:
  ```bash
  cd /public/softlife/08-app/deploy/cloudflare
  npx wrangler@4.158.0 d1 execute gabochie-db --remote \
    --file=migrations/002-onboarding.sql --config wrangler.toml
  ```
- [x] Confirm the tables exist:
  ```bash
  npx wrangler@4.158.0 d1 execute gabochie-db --remote \
    --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'softlife_%' ORDER BY name" \
    --config wrangler.toml
  ```
- [x] Confirm `softlife_onboarding` and `softlife_events` are listed.

## C. Build, bump and deploy

Completed 2026-11-14.

- [x] Confirm `app/sw.js` has a fresh cache version for this release.
- [x] Build and deploy only from the correct directory:
  ```bash
  cd /public/softlife/08-app/deploy/cloudflare
  sh build.sh
  npx wrangler@4.158.0 deploy --config wrangler.toml
  ```
- [x] Confirm the Worker deploy did not create a second accidental Worker.
- [x] Confirm `https://soft.gabochie.com/legal/privacy/` includes the WhatsApp
  consent section.

## D. Verify in production

**Technical deployment completed 2026-11-14.** D1 backup, migration, Worker
deploy, production API checks, a full browser signup → onboarding → consent
withdrawal flow, member task/event actions, admin dashboard login and consent
CSV download all passed. Test records and test admin sessions were removed.

- [x] Sign up with a new test email carrying `?utm_source=test&utm_campaign=consent`.
- [x] Confirm signup lands on the onboarding form.
- [x] Save a profile and confirm the dashboard prompt disappears.
- [x] Confirm the account page shows the saved profile state.
- [x] Tick WhatsApp consent, enter a number with country code and save.
- [x] Confirm the admin dashboard shows the profile and opt-in count.
- [x] Export consenting contacts and confirm the CSV contains only opted-in
  people and no non-consenting numbers.
- [x] Untick consent and save.
- [x] Confirm the active WhatsApp number is cleared and the account shows
  **Not joined**.
- [x] Confirm the admin opt-in count decreases.
- [x] Confirm an invalid or missing number cannot be saved with consent ticked.
- [x] Confirm a normal signup, task toggle, audio play and checkout click work.
  Production API endpoints were verified; the checkout button uses the same event hook.
- [x] Confirm the admin dashboard and consent CSV export in a browser.
  A real browser login and CSV download were verified; only the consented row was exported.
- [x] Delete the test member's onboarding/events/session records after testing.

## E. WhatsApp community workflow

This is the remaining work for this task.

- [ ] Decide whether the community is a WhatsApp Community or a group. Prefer a
  Community so members can choose which groups to join.
- [ ] Create the invite link and store it in a password manager, not this repo.
- [ ] Write short community rules: respect, no spam, no unsolicited DMs, no
  income guarantees, and how to leave.
- [ ] Export consenting contacts from **Admin → Audience**.
- [ ] Send the invite only to people in that export.
- [ ] Do not add buyers or members who did not tick consent.
- [ ] Do not share the contact list with anyone, including community members.
- [ ] When someone withdraws, remove their number from active use and mark the
  withdrawal in the admin/export record.
- [ ] Keep the consent CSV out of the repo and delete local copies when done.
- [ ] If the Privacy Policy or consent wording changes, update `CONSENT_VERSION`
  in `worker.js` and `server/api.py`, redeploy and re-collect consent where
  required.

## F. Decisions

| Decision | Default |
| --- | --- |
| Is onboarding required? | No — it is optional and skippable |
| Is WhatsApp contact required? | No — unchecked by default |
| Can buyers be added without consent? | No |
| Is email marketing consent separate? | Yes |
| Where is consent withdrawn? | Account → Profile & community |
| What happens to the number on withdrawal? | It is cleared from the active profile |
| How long is onboarding/event data kept? | Until the member asks for deletion; no automatic purge |
| How are deletion/export requests handled? | Manual email request until self-service exists |

## G. Data rights and retention

This is manual until a self-service control is added.

- [ ] Document the deletion/export request address and response target in the
  Privacy Policy and support templates.
- [ ] On deletion, remove the member, onboarding row, tasks, events, sessions and
  audio tokens; keep only purchase/refund records required by law or Selar.
- [ ] On export, provide the member's account and onboarding data in a readable
  format; do not include other members or internal secrets.
- [ ] Run one deletion and one export against a test account and record the result.
- [ ] Confirm the operator knows who handles these requests and the target
  response time.
- [ ] Add self-service deletion/export if request volume or regulation requires it.

## Acceptance criteria

- The migration is applied and backed up.
- Signup and onboarding work in production.
- Consent is explicit, timestamped and versioned.
- Withdrawal clears the number and is visible to the member.
- Admin can export only consenting contacts.
- Non-consenting members and buyers are not contacted on WhatsApp.
- The Privacy Policy and Terms match the behaviour.
- A documented deletion/export process exists and one test request has been run.
