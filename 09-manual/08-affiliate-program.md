# 08 — Affiliate Program

**Priority:** P1 — can happen during the test launch, but the copy must not promise
a commission that Selar is not configured to pay.

## Pickup card

- **Pick ID:** `AFFILIATE-01`
- **Status:** Waiting
- **Outstanding:** commission policy, Selar affiliate setup, attribution and real referral/refund test.
- **Need from you:** 30%/launch-partner decision, commission basis, payout schedule and test-purchase approval.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/AFFILIATE-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up AFFILIATE-01`; full steps in `00-execution-board.md`.

The frontend and `/api/affiliate` currently show **30% standard commission**.
Selar is not configured, there is no in-app commission ledger, and no real
referral purchase has been tested.

## A. Decide the policy

- [ ] Confirm **30% standard** commission for the $19.99 founding bundle.
- [ ] Decide whether a small launch-partner group gets 50%; if yes, define the
  eligibility, duration and how the rate is tracked.
- [ ] Confirm the commission basis: gross product price or net after Selar fees.
- [ ] Confirm refund treatment: reverse commission on refunded orders.
- [ ] Confirm the payout schedule and minimum payout.
- [ ] Confirm the affiliate disclosure requirement in the Terms.

## B. Configure Selar

- [ ] Create or enable the Selar affiliate program for the Complete bundle.
- [ ] Set the standard commission to **30%**.
- [ ] Add the launch-partner rate only if it is real and tracked separately.
- [ ] Add the affiliate terms and disclosure requirements.
- [ ] Confirm Selar's cookie/attribution window.
- [ ] Confirm how Selar pays affiliates and in which currencies.
- [ ] Confirm how refunds and chargebacks affect commissions.

## C. Connect referral attribution

- [x] Confirm `?ref=CODE` on the app is stored through signup (automated test).
- [ ] Confirm the member's `ref_code` is appended to the Selar checkout URL.
- [ ] Confirm Selar records the referral on the order.
- [ ] Confirm the order can be matched back to the referring member.
- [ ] Decide how to handle a buyer who clicks one link but checks out by email.

## D. Test with a real referral purchase

- [ ] Create a test affiliate account.
- [ ] Open the affiliate link in a private window.
- [ ] Sign up through the link and complete a small real purchase.
- [ ] Confirm the signup records the referral.
- [ ] Confirm Selar records the commission at 30%.
- [ ] Refund the purchase and confirm the commission is reversed.
- [ ] Confirm the frontend and `/api/affiliate` both show 30%.
- [ ] Clean up the test purchase, commission and account.

## E. Copy and claims

- [ ] Confirm no public copy promises 50% unless the program actually pays it.
- [ ] Confirm the affiliate page says payouts follow Selar's schedule.
- [ ] Confirm the affiliate page does not promise "everything your referrals
  buy" if only the Complete bundle is commissionable.
- [ ] Confirm the affiliate page and Terms require disclosure of the commission.

## Acceptance criteria

- Selar pays the stated 30% commission on a real referred purchase.
- Refunds reverse the commission.
- The app and Selar agree on the referral and the rate.
- No public copy promises a rate or product coverage that Selar does not support.

## Current status

- [x] Frontend and API show 30% standard commission.
- [x] Referral capture at signup verified; no real Selar referral test yet.
- [ ] Selar affiliate program configured.
- [ ] Real referral purchase tested.
- [ ] Refund/commission reversal tested.
- [ ] Affiliate terms and disclosure reviewed.
