# Agentic Path: Running The Soft Life System With Supervised Autonomy

**Status:** Brainstorm only. Nothing in this document has been built, bought,
connected or executed.  
**Prepared:** 14 November 2026  
**Context:** Follow-on to `11-money/OFFERING-REVENUE-COST-AUDIT.md` and the public
essay `08-app/app/blog/ai-agents-soft-life-business/`.

## 1. The short answer

Yes, this business is a strong candidate for an agentic operating model, but
**not for a fully autonomous business**. The right target is:

> **A supervised autonomous back office:** agents do the repetitive work, the
> owner approves money, legal, public claims and production changes.

The product is digital, the delivery path is already software, the content is
structured, and the customer journey is simple. That removes most of the reasons
autonomy fails in physical businesses. The remaining risks are trust, payments,
platform rules, privacy and brand judgment. Those are exactly the places a human
must stay in the loop.

## 2. What "autonomous" should mean here

Autonomy is a spectrum, not a switch.

| Level | Name | What the agent can do | Owner role |
| --- | --- | --- | --- |
| L0 | Manual | Nothing | Does everything |
| L1 | Assist | Drafts, summarizes, suggests | Reviews every output |
| L2 | Copilot | Acts after per-task approval | Approves each action |
| L3 | Supervised autonomy | Acts inside policy, queues exceptions | Reviews exceptions and reports |
| L4 | High autonomy | Owns a workflow end to end within hard limits | Audits and handles escalations |
| L5 | Unattended autonomy | Sets goals, changes its own rules | Absent |

**Recommendation:** start at **L2**, reach **L3** for support, content and
reporting, and allow **L4** only for low-risk, reversible workflows after at least
90 days of clean operation. Do not use L5 for this business.

## 3. Why this business fits

### Strong fit

- **Digital fulfilment.** The eBook, audio, worksheets and app access are already
  deliverable by software.
- **Simple offer.** One bundle, one checkout, one account upgrade path.
- **Structured content.** The manuscript, blog, audio and policies are text-based
  and searchable.
- **Existing control plane.** The app already has D1, KV, auth, purchases,
  referrals, admin views and a webhook.
- **Low headcount.** The owner is the bottleneck, so offloading drafting,
  reporting and triage has immediate value.
- **Measurable funnel.** Visitors, signups, purchases and support requests can be
  logged as events.
- **Agentic discovery is already partly built.** `llms.txt`, `llms-full.txt`,
  `openapi.json`, structured data and clean HTML make the offer readable by AI
  assistants.

### Weak fit

- **Trust and brand voice.** The product sells a calmer way of working. A
  robotic, over-eager agent would damage the promise.
- **Legal and consumer risk.** Refunds, claims, privacy and tax need human
  accountability.
- **Payment and platform dependency.** Selar, email and social platforms can
  change rules or fail.
- **Exceptions.** Refunds, chargebacks, account recovery, complaints and
  vulnerable customers are not happy-path tickets.
- **Autonomy can hide errors at scale.** A bad prompt or stale policy can damage
  many relationships before a human notices.

## 4. Two agentic paths

There are two distinct opportunities. Keep them separate.

### A. Internal agentic operations

Agents run the business's own work: support, content, reporting, onboarding,
affiliate operations and quality checks. This is the main path in this document.

### B. External agentic buyers

AI assistants increasingly research, compare and recommend products. The business
can become easier for those agents to understand and buy from:

- Keep prices, deliverables, refund terms and access rules in machine-readable
  form.
- Expose a clean product and policy feed, not only marketing pages.
- Add an MCP-style product/policy endpoint later, if it earns its keep.
- Make checkout links stable and trackable.
- Avoid dark patterns and ambiguous claims that an assistant cannot verify.
- Keep human support available when an AI assistant gets it wrong.

This channel is speculative. Do not build for it before the human funnel works.

## 5. Target operating model

```text
Owner
  |
  v
Orchestrator / Chief-of-Staff Agent
  |-- Content Agent
  |-- Growth Agent
  |-- Support Agent
  |-- Fulfilment Agent
  |-- Finance Agent
  |-- Compliance Agent
  |-- Analytics Agent
  |-- QA Agent
  |
  v
Tool layer: Cloudflare, D1, KV, Selar, email, analytics, social APIs, files
  |
  v
Event log + approval queue + audit trail + kill switch
```

The orchestrator does not do the work. It routes jobs, enforces policy, tracks
state and escalates. Each specialist agent has a narrow remit and a hard list of
things it cannot do.

## 6. Agent roster

| Agent | Mission | Autonomy | Hard stops |
| --- | --- | --- | --- |
| Orchestrator | Route jobs, track SLAs, enforce policy, produce daily brief | L3 | Cannot change policy, prices or spend |
| Support | Classify tickets, draft replies, resolve known intents | L2→L3 | No refunds, legal, security or vulnerable-customer replies without review |
| Fulfilment | Verify purchases, unlock access, handle failed deliveries | L3 | No manual tier changes above policy threshold |
| Content | Draft posts, emails, FAQs, repurposing and SEO updates | L2 | No publishing without approval; no new claims |
| Growth | Find affiliate leads, draft outreach, monitor channels | L2 | No mass DMs, no spam, no paid spend |
| Finance | Reconcile sales, fees, refunds, affiliate payouts, runway | L2 | No payment execution; no tax filing |
| Compliance | Check claims, links, consent, policy drift and platform rules | L2 | Advisory only; cannot approve legal text |
| Analytics | Build funnel reports, detect anomalies, forecast | L3 | Read-only on production data |
| QA | Test checkout, audio, links, accessibility and webhooks | L3 | Cannot deploy; may open incidents |

## 7. Tool and data layer

### Existing assets to build on

- Cloudflare Worker at `08-app/deploy/cloudflare/worker.js`
- D1 tables for users, tasks, purchases, referrals and admin sessions
- KV audio library
- Selar checkout and purchase webhook
- Static blog, legal pages, feeds, sitemap, `llms.txt`, `openapi.json`
- Admin dashboard for members, purchases, referrals and audio status
- Python build tools for blog, images and the book

### Likely new pieces

| Layer | Option | Why |
| --- | --- | --- |
| Job queue | Cloudflare Queues or a D1 jobs table | Durable retries and auditability |
| Scheduling | Worker cron triggers | Daily/weekly loops |
| Agent state | D1 + KV | Simple, inspectable, close to existing stack |
| Document memory | Vectorize or keyword search over D1 | Find policies, FAQs and past tickets |
| Secrets | Cloudflare secrets + password manager | No secrets in prompts or files |
| Approval UI | Extend `#/admin` | One place to review agent actions |
| Observability | Structured logs + daily digest | Detect drift, cost and failures |
| Evaluation | Fixed test set of 50–100 tasks | Measure quality before autonomy |

### Build-versus-buy

Start with a **thin custom orchestration layer** on the existing Cloudflare app.
It keeps data, permissions and audit logs in one place. A no-code tool such as
n8n or Make is useful for prototyping, but it becomes another system of record
and another place for secrets to leak. Browser automation should be a last
resort; use official APIs and webhooks where they exist.

## 8. Candidate autonomous loops

### Daily

- Triage new support tickets and draft replies.
- Check purchases, failed webhooks and accounts stuck on the wrong tier.
- Watch for broken links, checkout errors and audio failures.
- Repurpose one approved content idea into channel drafts.
- Produce a short owner brief: sales, support, anomalies, decisions needed.

### Weekly

- Reconcile revenue, refunds and affiliate activity.
- Draft the next content calendar from search and customer questions.
- Identify inactive affiliates and draft personal follow-ups.
- Review SEO pages with declining traffic.
- Summarize customer language for offer and copy improvements.

### Monthly

- Close the books and produce a simple P&L.
- Review price, conversion and refunds.
- Refresh one underperforming page or email.
- Check policy, consent and platform-rule drift.
- Audit a random sample of agent decisions.

### Event-driven

| Event | Agent response | Approval |
| --- | --- | --- |
| Purchase webhook | Verify, upgrade account, send welcome | Automatic |
| Duplicate webhook | Suppress, log, alert if mismatch | Automatic |
| Refund request | Gather facts, draft options | Human |
| Failed payment | Send recovery email with checkout link | Automatic within limit |
| Signup with purchased email | Claim purchase, confirm access | Automatic |
| Support ticket | Classify, draft, resolve known intents | Human until proven |
| Affiliate application | Score fit, draft welcome | Human |
| Security incident | Freeze, alert, preserve logs | Human immediately |

## 9. Approval gates

### Never autonomous

- Changing price, currency, taxes or refund policy.
- Issuing refunds, chargebacks or affiliate payouts.
- Making legal, medical, income or mental-health claims.
- Signing contracts, accepting new platform terms or entering new markets.
- Deleting customer data, accounts or backups.
- Changing production code, infrastructure or access permissions.
- Responding to legal threats, security incidents or press crises.
- Handling vulnerable customers or sensitive personal data.

### Approval queue

- Public posts, emails and affiliate outreach.
- Discounts and launch-partner offers.
- Support replies outside the approved intent list.
- Any spend above a small monthly cap.
- New integrations and new data sources.

### Automatic, within policy

- Purchase verification and tier upgrades.
- Welcome and receipt-adjacent messages using approved templates.
- Internal reports, summaries, tagging and data cleanup.
- Draft generation that is clearly marked as a draft.
- Read-only monitoring and alerts.
- Reversible actions with a complete audit trail.

## 10. Guardrails

| Risk | Control |
| --- | --- |
| Over-spending | Monthly cap, per-action cap, prepaid model credits, alerts |
| Wrong public claim | Claim library, banned-phrase list, human approval |
| Prompt injection | Treat customer content as untrusted; separate instructions from data |
| Secret leakage | Secrets only in tool layer, never in prompts, logs or tickets |
| Runaway loops | Max steps, max retries, timeouts, circuit breaker, kill switch |
| Data exposure | Least privilege, per-agent tokens, PII redaction, retention limits |
| Irreversible action | Dry-run mode, snapshots, rollback plan, two-step confirmation |
| Quality drift | Golden test set, random audit, weekly review |
| Platform ban | Official APIs, rate limits, no spam, human review of outreach |
| Dependency failure | Fallback to manual queue, not silent failure |

The kill switch must be one obvious action: pause all agents, stop all queued
jobs, and leave the human with a readable incident summary.

## 11. Economics

The point is not to replace the owner with free software. The point is to buy
back time without adding fragility.

| Cost | Early estimate | Notes |
| --- | ---: | --- |
| LLM usage | $20–150/month | Depends on volume, model and context size |
| Orchestration/hosting | $0–50/month | Cloudflare paid plan may already be needed |
| Email/transactional | $0–30/month | Free tiers may cover the test launch |
| Observation/eval tooling | $0–50/month | Can start with logs and a spreadsheet |
| Human review | 2–6 hours/week | The real cost; must be scheduled |
| **Total early range** | **~$40–280/month** | Before owner time and payment fees |

Compare that with the cost of manual support and content production. If the agent
stack costs $150/month and saves 10 owner hours at $25/hour, it pays for itself
before it improves speed. If it creates rework, it is negative even when the token
bill is small.

Track these unit costs from day one:

- Cost per support ticket resolved.
- Cost per published content piece.
- Cost per affiliate recruited.
- Cost per purchase influenced.
- Owner minutes saved per week.
- Error rate and rework rate.

## 12. Phased roadmap

### Phase 0 — Instrument first (1–2 weeks)

- Define 10 core SOPs in plain language.
- Add an `agent_events` log: job, input, decision, output, cost, approval, result.
- Create a 50-task evaluation set with known good answers.
- Decide the approval matrix and spend caps.
- Move all secrets to a password manager and scoped tokens.
- Pick one workflow to pilot. Recommended: **support triage**.

### Phase 1 — Copilots, human sends (30 days)

- Support agent drafts replies; owner sends.
- Content agent drafts one post and one email per week.
- Analytics agent produces a weekly brief.
- Finance agent reconciles purchases and refunds.
- Measure draft acceptance and time saved.

### Phase 2 — Supervised autonomy (60–90 days)

- Auto-tag and auto-route tickets.
- Auto-answer a small list of safe intents, with a human review sample.
- Auto-publish approved content through a queue.
- Auto-verify purchases and recover failed upgrades.
- Add an approval inbox to `#/admin`.

### Phase 3 — High autonomy for low-risk work (90–180 days)

- 24/7 first-response support for known intents.
- Autonomous affiliate onboarding and follow-up.
- Autonomous SEO/content refresh within an approved plan.
- Autonomous anomaly detection and incident creation.
- Quarterly agent audit and policy review.

### Phase 4 — Portfolio factory (only after this business is stable)

- Reuse the same operating system for Books 2–5, DWY and DFY.
- Separate brand voice, policy and approval rules per product.
- Keep one human accountable for the portfolio.

## 13. First experiment: support triage only

Do not start with "build an autonomous company". Start with one measurable
workflow.

**Goal:** reduce owner support time by 30% without lowering reply quality.

**Scope:**

- Read new support emails/tickets.
- Classify intent: access, refund, receipt, audio, account, partnership, other.
- Draft a reply using approved policies and the customer's facts.
- Escalate refunds, legal, security and vulnerable customers.
- Log confidence, sources and time saved.

**Success gates:**

- 90% of drafts use only approved policy facts.
- 80% of drafts accepted with minor or no edits after 30 days.
- Zero unauthorised refunds, tier changes or public claims.
- Median first-response time improves.
- Owner time per ticket falls by at least 30%.

If those gates fail, do not expand autonomy. Fix the knowledge base, policy or
evaluation set first.

## 14. Risks and open questions

| Question | Why it matters |
| --- | --- |
| What is the owner's risk appetite? | L3 and L4 require different review loads |
| How many hours per week can be reserved for review? | Autonomy without review is just unattended error |
| Which channels are allowed? | Social APIs and platform rules vary |
| Does Selar expose a stable API or only webhooks? | Determines whether finance and affiliate work can be automated safely |
| Where will customer data live? | Privacy, residency and retention obligations |
| What is the monthly agent budget? | Prevents silent cost drift |
| Which actions are reversible? | Reversible actions can be more autonomous |
| Who is on call for incidents? | One named human, not "the team" |
| How will quality be evaluated? | Without a test set, autonomy is vibes |
| When does autonomy become a brand risk? | The calm promise must survive the automation |

## 15. What not to do yet

- Do not connect agents to live payments, refunds or payouts.
- Do not give an agent production deploy access.
- Do not let agents publish to public channels unsupervised.
- Do not automate social DMs or mass outreach.
- Do not build a custom model or a complex multi-agent framework first.
- Do not add an MCP server or agentic-commerce checkout before the human funnel
  converts.
- Do not measure success by token spend or "agents built". Measure owner time,
  quality and revenue.

## 16. Recommended next move

If the owner wants to pursue this later:

1. Write the 10 SOPs and the approval matrix.
2. Add the event log and a support-ticket evaluation set.
3. Run a four-week support-triage pilot with human sending.
4. Review the pilot against the success gates.
5. Only then decide whether to build Phase 2.

The agentic path is promising because the business is already software-shaped.
The discipline is to automate **one boring, measurable workflow at a time** and
keep the owner accountable for money, law, security and trust.
