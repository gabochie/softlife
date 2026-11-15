# 06 — SEO, Analytics and Launch Operations

**Priority:** P1 during the test launch; P2 after it.

## Pickup card

- **Pick ID:** `SEO-01`
- **Status:** Waiting
- **Outstanding:** Search Console/Bing, rich-result/OG validation, analytics decision, tracking sheet and owner.
- **Need from you:** search-console access or results, preview results, analytics choice and monitoring owner.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/SEO-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up SEO-01`; full steps in `00-execution-board.md`.

The discovery files and structured data are already generated and deployed.
This file covers accounts, submissions, previews, analytics and launch tracking
that require human access to external dashboards.

## A. Search engines

- [ ] Add `soft.gabochie.com` as a property in Google Search Console.
- [ ] Verify ownership using DNS or the HTML verification file.
- [ ] Submit `https://soft.gabochie.com/sitemap.xml`.
- [ ] Request indexing for the home page, products page, consultation page, blog
  index, all 5 posts and legal pages.
- [ ] Confirm Google can fetch `robots.txt` and the sitemap.
- [ ] Check the Page Indexing report for unexpected exclusions.
- [ ] Add the site to Bing Webmaster Tools.
- [ ] Submit the same sitemap to Bing.
- [ ] Confirm Bing can fetch the robots and sitemap files.
- [ ] Consider IndexNow for faster Bing updates.
- [ ] Recheck indexing one week after launch.

## B. Rich results and metadata

- [ ] Validate the home-page structured data.
- [ ] Validate the Product/Service structured data on `/products/` and
  `/consultation/`.
- [ ] Validate one blog post's `Article`/`BlogPosting` structured data.
- [ ] Confirm the FAQ structured data is valid.
- [ ] Confirm every page has a unique title and description.
- [ ] Confirm canonical URLs are absolute and correct.
- [ ] Confirm `og:type` is `website` for the home/legal/blog index and `article`
  for posts.
- [ ] Confirm OG images are 1200×630 and load publicly.
- [ ] Test link previews for the home page, a blog post and a legal page in:
  - Facebook Sharing Debugger
  - LinkedIn Post Inspector
  - X/Twitter card preview, if available
- [ ] Refresh cached previews after any metadata change.

## C. Analytics decision

Choose one:

### Option 1 — No analytics for the test launch

- [ ] Accept that conversion and traffic data will be manual.
- [ ] Track test buyers in a spreadsheet.
- [ ] Do not add tracking scripts or cookies.

### Option 2 — Privacy-friendly analytics

- [ ] Enable Cloudflare Web Analytics or another cookieless provider.
- [ ] Confirm it does not set advertising cookies.
- [ ] Update the Privacy Policy with the provider and purpose.
- [ ] Add a consent banner only if the chosen tool requires one.
- [ ] Verify events/pageviews appear.
- [ ] Confirm the script does not break the PWA or service worker.

### Option 3 — Full analytics

- [ ] Add consent management before any tracking.
- [ ] Update the Privacy Policy and cookie disclosures.
- [ ] Add conversion events: signup, checkout click, purchase, audio play.
- [ ] Keep internal product events separate from third-party analytics; do not
  send emails, WhatsApp numbers or payment data to analytics.
- [ ] Test that analytics does not collect email addresses or payment data.
- [ ] Confirm the consent state is respected on repeat visits.

Do not add advertising pixels before the legal/consent work is complete.

## D. Launch tracking

- [ ] Create UTM links for each launch channel. The app stores first-touch UTM
  data at signup.
- [ ] Review acquisition source in the admin audience data after launch.
- [ ] Add a simple spreadsheet for:
  - visitor source
  - signup
  - checkout click
  - purchase
  - refund
  - support issue
- [ ] Define the test-launch success threshold. Suggested: 10 buyers complete
  the full flow with no blocking support issue.
- [ ] Decide how long the test runs before the public launch.
- [ ] Record the Selar order IDs used in the test.
- [ ] Record refunds and manual downgrades.
- [ ] Review the funnel after the test.

## E. Monitoring and alerts

- [ ] Confirm Worker error alerts are enabled.
- [ ] Confirm D1 usage is below the free-plan limit.
- [ ] Confirm KV reads/writes are within plan.
- [ ] Confirm the custom domain certificate expiry is monitored.
- [ ] Set a reminder to check logs after each launch email.
- [ ] Decide who responds to a broken checkout or audio outage.
- [ ] Keep the D1 backup schedule.

## F. Launch content and social

These overlap with `../04-marketing/book-01-launch-plan.md`; do not duplicate
the full book launch here.

- [ ] Confirm the launch announcement links to `https://soft.gabochie.com`.
- [ ] Confirm the link-in-bio points to the app or checkout.
- [ ] Prepare one post explaining the free chapters.
- [ ] Prepare one post explaining the complete bundle.
- [ ] Prepare a short "how to install the app" note for mobile buyers.
- [ ] Prepare a support/FAQ post for common access issues.
- [ ] Confirm social preview images are current.
- [ ] Decide native sharing: the app currently has OG/Twitter previews and an
  affiliate Copy link only — no `navigator.share` UI.
- [ ] If approved, add mobile share-sheet support with WhatsApp/X/copy fallbacks
  and test on desktop and mobile.
- [ ] Ask early testers for permission before quoting them.

## G. Post-launch review

- [ ] Review conversion from checkout click to purchase.
- [ ] Review refund reasons.
- [ ] Review support themes.
- [ ] Review search indexing.
- [ ] Review audio playback errors.
- [ ] Decide whether email verification is needed before public scale.
- [ ] Decide whether Cloudflare Access or stronger admin protection is needed.
- [ ] Decide whether to schedule the Supabase migration.
- [ ] Update this directory with what changed.

## Acceptance criteria

- Search engines can discover and index the site.
- Social previews show the correct title, description and image.
- The analytics/consent decision is documented and implemented consistently.
- Test-launch traffic and purchases can be reviewed without exposing buyer data.
- Monitoring and backups are owned by a named person.

## Current status

- [x] Sitemap, robots, llms, OpenAPI and security.txt deployed.
- [x] Canonicals, OG tags, structured data and feeds generated.
- [x] Cloudflare Workers observability enabled.
- [x] First-touch UTM capture and internal product events deployed.
- [ ] Search Console and Bing Webmaster configured.
- [ ] OG previews checked in external debuggers.
- [ ] Analytics/consent decision made.
- [ ] Launch tracking sheet created.
- [ ] Monitoring ownership assigned.
