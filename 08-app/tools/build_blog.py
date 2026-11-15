#!/usr/bin/env python3
"""Build the static Soft Life Journal, legal pages, feeds and agent discovery files."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
SITE = "https://soft.gabochie.com"
BRAND = "The Soft Life System"
JOURNAL = "The Soft Life Journal"
AUTHOR = "Deon ChristoLove"
ORG = "Gabochie Books"
EMAIL = "admin@gabochie.com"
TODAY = "2026-11-15"
UPDATED = "2026-11-14"
DEFAULT_OG = "/assets/blog/og-default.png"

POSTS = [
    {
        "slug": "15-hour-workweek-for-women",
        "title": "The 15-Hour Workweek for Women Who Are Done Doing Everything",
        "dek": "The goal is not to work less so you can squeeze in more. It is to build a business that pays for your life, then protects the life it paid for.",
        "description": "A practical guide to building a business that runs in 15 hours a week, for women who are done being the bottleneck in their own lives.",
        "category": "Soft Life",
        "date": "2026-11-14",
        "updated": "2026-11-14",
        "read": 9,
        "tags": ["15-hour workweek", "soft life business", "women entrepreneurs", "time freedom"],
        "og": "/assets/blog/og-15-hour-workweek.png",
        "faq": [
            ("Is a 15-hour workweek actually realistic?", "Yes, for a focused service or digital-product business with one clear offer, simple delivery and a small amount of leverage. It is not realistic if you are still selling five different things to five different audiences."),
            ("What if my business needs more hours right now?", "Then give it more hours temporarily, but give it a deadline. The 15-hour target is a design constraint, not a moral test. Use the constraint to force better decisions about offers, process and delegation."),
            ("Do I need a team to work 15 hours a week?", "No. You need one repeatable offer, templates, a calendar that protects your genius work, and the discipline to stop doing low-value tasks. A team comes later, when the process is visible enough to hand over."),
            ("How do I start when everything feels urgent?", "Pick one outcome for the next 90 days, write down the three activities that actually create it, and put everything else on a not-now list. The first win is a calendar that tells the truth."),
        ],
        "md": """
The promise of the 15-hour workweek is not laziness. It is leverage.

Most women who build a business do not need another productivity hack. They need permission to stop treating exhaustion as proof of seriousness. They need a business model that can survive a Tuesday afternoon off, a sick child, a slow season, or a decision to finally put the phone down.

The Soft Life System starts with a simple constraint: **your business should fit inside a life you actually want to live**. For many women, that means 15 focused hours a week. Not 15 hours of frantic multitasking. Fifteen hours of high-value work, supported by systems that carry the rest.

## The trap: a business that never closes

You started because you wanted freedom. Then the business became a second household: always hungry, always open, always asking for more.

The trap is not work itself. The trap is undifferentiated work. You are the sales team, the delivery team, the customer service desk, the accountant, the marketer and the cleaner. Every new client adds a new custom process. Every new idea adds another offer. The business grows, but your life shrinks.

A 15-hour week is impossible inside that model. It becomes possible when you separate the work that needs *you* from the work that needs *a system*.

## The 15-hour math

Fifteen hours is not a random number. It is enough time for the work that genuinely compounds:

- **4 hours of genius work** — the thinking, creating and client transformation only you can do.
- **4 hours of growth** — conversations, content, referrals and offers that bring the next right client.
- **4 hours of delivery and operations** — the parts of the promise that must be kept.
- **3 hours of review, learning and margin** — the buffer that keeps the week human.

That adds up to 15. Notice what is not on the list: endless scrolling, reactive email, custom proposals for people who were never going to buy, and rebuilding your website every time you feel anxious.

## The four jobs of a soft life business

Every business has four jobs. The mistake is trying to do all four at once, every day.

1. **Choose** — decide who you serve, what outcome you sell, and what you will not do.
2. **Create** — make the offer, the content and the experience that deliver the outcome.
3. **Carry** — build the templates, automations and people that carry routine work.
4. **Check** — review the numbers, the calendar and the energy, then adjust.

When you know which job you are doing, you stop confusing motion with progress. A 15-hour week is simply a week where each job gets its proper share.

## What to stop doing

You cannot add a soft life on top of a hard life. Something has to come out.

Stop customising everything. If every client needs a new proposal, a new workflow and a new price, you do not have a business. You have a series of favours with invoices.

Stop treating availability as a service. Fast replies are not the product. The transformation is the product. Boundaries are part of the delivery.

Stop adding offers to solve anxiety. A new offer feels like progress because it is new. Usually it is just another way to avoid finishing the one that would actually work.

Stop confusing being needed with being valuable. The goal is not to be indispensable to every client. The goal is to be irreplaceable in the specific transformation you sell, then let systems handle the rest.

## A week that breathes

A soft life week is designed, not discovered. It has edges.

Monday morning is for the genius work. Tuesday is for client delivery. Wednesday is for growth conversations and content. Thursday is for operations and the small decisions that keep promises. Friday is for review, learning and the next week's margin.

The exact days can change. The principle cannot: **protect the blocks that create the outcome, and let the rest be handled in batches**.

You will be tempted to fill the margin. The margin is not empty. The margin is the thing that makes the week sustainable. It is where rest, repair and better ideas live.

## The first 90 days

Do not try to build the perfect business. Build the smallest business that can run without you for a week.

In the first 30 days, choose one audience, one offer and one outcome. Write the promise in one sentence. Build the simplest delivery process you can repeat.

In the next 30 days, document the process. Create the templates. Notice where you are the bottleneck. Move one repeated task into a system or a person.

In the final 30 days, protect the calendar. Measure the hours that actually create value. Cut one thing that does not. Then repeat the cycle.

The 15-hour week is not a finish line. It is a practice. Some weeks will be heavier. Some will be lighter. The point is to keep returning to the design.

## Start with one honest week

Before you change anything, track one week honestly. Not the week you wish you had. The real one.

Where did the hours go? Which work made money, built trust or delivered the promise? Which work only felt urgent because someone else was anxious?

You do not need a perfect answer. You need a truthful starting point. The soft life begins when the calendar stops lying.

> The goal is not a business that needs you every hour. The goal is a business that supports the life you are working for.

If you want the full system, the app turns the book's 90-day plan into a task list you can actually work through. Start free, listen to the introduction and Chapter 1, and design your first honest week.

[Start your free Soft Life account](/#/signup)
""",
    },
    {
        "slug": "hustle-hangover-signs",
        "title": "The Hustle Hangover: 7 Signs You Built a Job, Not a Business",
        "dek": "You are busy, booked and quietly exhausted. That is not always a growth problem. Sometimes it is a design problem.",
        "description": "Seven honest signs that you built a job instead of a business, and the first moves that create leverage without adding more hours.",
        "category": "Strategy",
        "date": "2026-11-10",
        "updated": "2026-11-10",
        "read": 8,
        "tags": ["hustle culture", "business design", "burnout", "leverage"],
        "og": "/assets/blog/og-hustle-hangover-signs.png",
        "faq": [
            ("Is it bad to have a job-like business?", "Not always. A job-like business can be profitable and satisfying for a season. The problem is when it is involuntary — when you cannot take time off, raise your prices or change the model without everything collapsing."),
            ("How do I know if I am the bottleneck?", "Look at what happens when you stop. If sales, delivery and decisions all pause when you close your laptop, you are the operating system. The fix is to document and transfer one repeated decision at a time."),
            ("What should I fix first?", "Fix the offer before the funnel. If every client needs a custom scope, no amount of marketing will create freedom. One clear offer with a repeatable delivery process is the foundation."),
        ],
        "md": """
The hustle hangover does not arrive with a dramatic crash. It arrives as a low hum: the laptop open at midnight, the Sunday scaries, the feeling that you are busy all the time but somehow never ahead.

You may still call it a business. And it may be profitable. But a profitable job is still a job if it owns your calendar, your decisions and your sense of safety.

Here are seven signs that you built a job instead of a business — and what to do about each one.

## 1. Revenue stops when you stop

This is the clearest test. Close your laptop for a week and watch what happens.

If the pipeline goes quiet, delivery stalls and every client waits for you, you are not running a business. You are running a very demanding solo practice with a logo.

A business has at least one repeating system that works without your hands: a simple offer page, a booking process, a delivery template, a follow-up sequence, a referral loop. It does not need to be fancy. It needs to exist.

## 2. Every client is a custom project

Custom work feels premium. Often it is just unpaid product development.

If every client needs a new proposal, a new scope, a new workflow and a new price, you are rebuilding the business every time someone says yes. That is not premium. It is fragile.

The alternative is not rigid. It is **structured flexibility**: one core offer with a clear promise, a defined process, and a small set of choices that do not require you to reinvent everything.

## 3. Your best ideas live in your head

You know exactly how to deliver the work. You just have not written it down.

When the process lives in your head, you cannot delegate it, automate it, improve it or take a break from it. Every task begins with a small act of recall. By the end of the day, you are tired from remembering as much as from doing.

A business brain is unglamorous: checklists, templates, saved replies, a simple project board, a short document that explains how the promise is kept. It is also the difference between a job and an asset.

## 4. Your calendar is full but your life is empty

A full calendar can look like success from the outside. From the inside, it can feel like a corridor with no doors.

The question is not "Am I busy?" The question is "What is this busyness buying me?" If the answer is "more busyness", you have a design problem.

Freedom does not come from clearing your inbox faster. It comes from protecting the hours that create the outcome and being willing to let the rest wait.

## 5. You cannot take a Tuesday off

Not a holiday. A Tuesday.

If a single ordinary day off creates a crisis, the business has no margin. Margin is not a luxury. It is the space where sickness, rest, creativity and unexpected life can exist without breaking the promise.

The first step is not a two-week vacation. It is a small block of unowned time: one morning, one afternoon, one day. Then you build the systems that make that block possible.

## 6. You keep adding offers instead of finishing one

A new offer feels like momentum. It gives you something to talk about, something to launch, something to hope for.

But every new offer adds a new delivery process, a new set of objections and a new audience to educate. If your current offer is not yet repeatable, a second offer usually multiplies the mess.

Finish one. Make it work. Make it easier to deliver. Then decide whether the business actually needs another branch.

## 7. You call firefighting "customer service"

Urgent requests, last-minute changes, "quick calls" and constant availability can feel like care. In practice, they are often the symptom of unclear boundaries and undocumented process.

Customer service is part of the product. But being permanently on call is not service. It is a business model that charges the owner's nervous system for every interaction.

## The way out

The fix is not to work harder on the same model. The fix is to redesign the model so it needs less of you.

Start with one offer. Write the promise in one sentence. Map the delivery process from intake to follow-up. Create three templates: a welcome message, a proposal or scope, and a follow-up. Then move one repeated task into a system or a person.

You will not feel free immediately. You will feel a little less replaceable by chaos. That is the beginning.

> A business is not something you own because you registered a name. It is something you own because it can keep its promise without your constant supervision.

The Soft Life System app gives you the 90-day plan as a set of tasks you can work through one at a time. Start free, listen to the introduction and Chapter 1, and find the first bottleneck worth fixing.

[Start your free Soft Life account](/#/signup)
""",
    },
    {
        "slug": "design-a-soft-life-week",
        "title": "How to Design a Soft Life Week (Free 90-Day Plan)",
        "dek": "A week with room to breathe is not a reward for finishing everything. It is a structure you build on purpose.",
        "description": "A step-by-step guide to designing a 15-hour workweek, with a sample schedule and a free 90-day plan you can adapt.",
        "category": "Systems",
        "date": "2026-11-06",
        "updated": "2026-11-06",
        "read": 10,
        "tags": ["soft life week", "90-day plan", "time blocking", "deep work"],
        "og": "/assets/blog/og-design-a-soft-life-week.png",
        "faq": [
            ("How many hours should I work in a soft life week?", "Start with the hours your life can actually sustain, then design the business around the highest-value work. For many focused service businesses, 15 to 25 hours is a realistic range. The number matters less than the ratio of genius work to busywork."),
            ("What goes in a 15-hour week?", "A simple split is four hours of genius work, four hours of growth, four hours of delivery and operations, and three hours of review and margin. Adjust the ratio to your season, but protect the margin."),
            ("What if I have a day job or caregiving responsibilities?", "Design a smaller week first. Two deep-work blocks and one operations block can be enough to make progress. The point is to create a repeatable rhythm, not to copy someone else's schedule."),
            ("How long before the plan feels natural?", "Give it 90 days. The first 30 days are for choosing the offer and the process. The next 30 are for documenting and delegating. The final 30 are for protecting the calendar and measuring what actually creates value."),
        ],
        "md": """
A soft life week is not a week with nothing to do. It is a week where the important work has a home, the routine work has a system, and the human being running the business has room to breathe.

Most time-management advice starts with the calendar. The Soft Life System starts with the business model. If the model is chaotic, the calendar will be too. You cannot schedule your way out of an offer that requires you to be everything to everyone.

Here is a practical way to design a week that fits a real life — plus a 90-day plan for making it stick.

## Step 1: Start with outcomes, not hours

Before you move a single meeting, answer three questions:

- What outcome am I selling?
- What are the three activities that actually create that outcome?
- What am I willing to stop doing so those three activities get protected?

Write the answers down. Keep them short enough to remember on a difficult Tuesday.

The point is not to fill every hour with productive work. The point is to make sure the work that matters is not crowded out by the work that merely feels urgent.

## Step 2: Build the 15-hour skeleton

A simple 15-hour skeleton looks like this:

- **4 hours of genius work** — the thinking, creating and transformation only you can do.
- **4 hours of growth** — conversations, content, referrals and offers that bring the next right client.
- **4 hours of delivery and operations** — keeping the promise, answering the right messages, improving the machine.
- **3 hours of margin** — review, learning, rest, repair and the unexpected.

You can move these hours around. You can shrink them in a busy season. You cannot remove the margin without paying for it later.

## Step 3: Put the blocks in the calendar

Choose the days and times that fit your real life. If you have a day job, your genius block may be early morning. If you have small children, it may be nap time or a childcare day. If you are the primary caregiver for a parent, it may be a shorter, more frequent block.

The goal is a repeatable rhythm, not a perfect aesthetic.

A sample week:

- **Monday:** 9:00–11:00 genius work. 11:00–12:00 admin and messages.
- **Tuesday:** 9:00–12:00 delivery. 12:00–13:00 follow-ups.
- **Wednesday:** 9:00–11:00 growth conversations. 11:00–12:00 content.
- **Thursday:** 9:00–12:00 delivery and operations. 12:00–13:00 templates and systems.
- **Friday:** 9:00–10:00 review. 10:00–11:00 learning. The rest is margin.

That is 15 hours. Notice how much is missing: no daily commute to the inbox, no reactive all-day availability, no heroic evenings. The work is concentrated so the rest can be real.

## Step 4: Protect the edges

A calendar is only a design until it meets a request.

Decide in advance how you will handle the common edge cases: urgent client messages, family needs, scope creep, "quick calls", and the temptation to fill a quiet hour with busywork.

You do not need a complicated policy. You need a few sentences you can repeat without negotiating:

- "I check messages at 11:00 and 15:00 on workdays."
- "New requests go through the intake form so I can scope them properly."
- "I do not take calls on Fridays."
- "This is outside the current scope; here is the option to add it."

Boundaries are not a rejection of care. They are what make consistent care possible.

## Step 5: The 90-day rollout

Do not try to change everything in one week. Build the rhythm in three 30-day layers.

### Days 1–30: Choose and simplify

Pick one audience, one offer and one outcome. Write the promise in one sentence. Cut one offer, one service or one habit that is not supporting the promise.

### Days 31–60: Document and transfer

Map the delivery process from intake to follow-up. Create three templates. Notice where you are the bottleneck. Move one repeated task into a system or a person.

### Days 61–90: Protect and measure

Track your actual hours for one week. Compare them to the skeleton. Cut one thing that does not create value. Protect the margin you have created. Then repeat the cycle.

## What to do when the week falls apart

It will. A client crisis, a sick child, a sudden opportunity or a low-energy week can break the design.

The response is not to abandon the design. The response is to return to it. Ask: what broke? Was it a boundary, a process, a capacity issue or an unrealistic promise? Fix the smallest thing that will make the next week easier.

The soft life is not a week without interruption. It is a week with a place to return to.

> A calendar is not a cage. It is a promise you make to the work that matters.

The app turns this plan into a 90-day task list, with the book's launch steps already loaded. Start free, listen to the introduction and Chapter 1, and design your first soft life week.

[Start your free Soft Life account](/#/signup)
""",
    },
    {
        "slug": "one-offer-premium-price",
        "title": "One Offer, Premium Price: The Simplest Business Model That Pays",
        "dek": "You do not need more offers. You need one offer that is clear, valuable and repeatable enough to build a life around.",
        "description": "How to package one premium offer, price the transformation instead of the hours, and deliver it without rebuilding your business for every client.",
        "category": "Offer Design",
        "date": "2026-10-30",
        "updated": "2026-10-30",
        "read": 9,
        "tags": ["premium offer", "pricing", "one offer business", "service business"],
        "og": "/assets/blog/og-one-offer-premium-price.png",
        "faq": [
            ("How do I know which offer to focus on?", "Choose the offer that produces a clear outcome for a specific audience and can be delivered with a repeatable process. If you are unsure, look at the work that already gets the best results and the least friction."),
            ("Can I charge premium prices without a big audience?", "Yes. Premium pricing is about the value of the outcome and the trust you can create, not the size of your following. A small audience that understands the transformation can support a premium offer."),
            ("What if clients ask for custom work?", "Keep the core offer fixed and offer a small number of clearly priced add-ons. Custom work is allowed, but it should be the exception, not the default operating model."),
            ("How do I raise my price?", "Raise it for new clients first, improve the promise and the experience, and give yourself time to deliver at the new level. Do not raise the price and add more work at the same time."),
        ],
        "md": """
The simplest business model is not the one with the most offers. It is the one where a clear promise, a premium price and a repeatable delivery process reinforce each other.

One offer does not mean one boring thing forever. It means one **core transformation** that you sell, refine and deliver well. Everything else is either an add-on, a future expansion or a distraction.

## The one-offer filter

A strong core offer passes four tests:

1. **One audience.** You can name who it is for and who it is not for.
2. **One problem.** The problem is urgent, expensive or emotionally heavy enough to pay to solve.
3. **One outcome.** The result is specific enough to describe in a sentence.
4. **One repeatable process.** You can deliver it without inventing a new business for every client.

If an offer fails one of these tests, it is not necessarily a bad idea. It is just not ready to be the center of your business.

## Price the transformation, not the hours

Hourly pricing punishes efficiency. The better you get, the less you earn for the same result. It also invites clients to compare inputs instead of outcomes.

Premium pricing starts with the value of the change: What is it worth to the client to solve this problem? What does it cost them to stay stuck? What would they happily pay for a reliable path to the outcome?

You are not charging for the time it takes to deliver. You are charging for the certainty, the process and the result.

This is why a premium offer needs a clear promise. If the outcome is vague, the price will always feel arbitrary.

## The premium offer formula

A useful structure is:

**I help [specific audience] achieve [specific outcome] through [specific mechanism] — without [the thing they dread].**

For example: "I help overwhelmed service providers book five premium clients a month through a one-offer positioning system — without adding more social media."

The formula is not a slogan. It is a design tool. It forces you to name the audience, the outcome and the mechanism. If you cannot fill in the blanks, the offer is still fuzzy.

## Deliver without improvising

A premium price does not buy a more complicated process. It buys a more reliable one.

Map the delivery from intake to follow-up:

- **Intake:** What do you need to know before you start?
- **Onboard:** What does the client need to feel safe and clear?
- **Execute:** What are the repeatable steps that create the outcome?
- **Handoff:** How do you make the result usable after the engagement?
- **Follow-up:** What keeps the relationship warm and the results alive?

Then create the templates that make each step easier. A welcome email, a scope document, a project checklist, a follow-up message. The goal is not to remove the human touch. It is to remove the unnecessary reinvention.

## Raise the price without adding hours

The safest way to raise a price is to raise the value and the clarity at the same time.

Improve the promise. Tighten the process. Add a small piece of support that genuinely reduces risk. Then raise the price for new clients first.

Do not add a hundred new deliverables to justify the increase. That usually makes delivery heavier and the offer less clear. Premium clients are often paying for focus, not volume.

## The quiet compounding effect

One offer gets easier to explain, easier to sell and easier to deliver. Every client teaches you something that improves the same process. Your templates get sharper. Your results get more consistent. Your reputation becomes specific.

That is compounding. A portfolio of unrelated offers does not compound in the same way. It fragments your attention and your proof.

## A smaller, stronger business

The point of one premium offer is not to make your business small forever. It is to make it strong enough to grow without chaos.

Start with one offer. Make it excellent. Document it. Then decide what the business actually needs next.

> Focus is not a restriction on your ambition. It is the way your ambition becomes a business instead of a blur.

The Soft Life System walks you through choosing one audience, one offer and one outcome, then building the delivery machine around it. Start free and work the first steps in the app.

[Start your free Soft Life account](/#/signup)
""",
    },
    {
        "slug": "ai-agents-soft-life-business",
        "title": "AI Agents Are Coming for Your Busywork. Build a Business With a Brain, Not More Hustle.",
        "dek": "The agentic era rewards businesses with clear processes, clean information and a human at the center — not businesses that simply work more hours.",
        "description": "How AI agents change the leverage equation for small businesses, what to automate first, and how to become discoverable in the age of AI search.",
        "category": "AI & Systems",
        "date": "2026-10-22",
        "updated": "2026-10-22",
        "read": 10,
        "tags": ["AI agents", "agentic era", "automation", "AEO", "business systems"],
        "og": "/assets/blog/og-ai-agents-soft-life-business.png",
        "faq": [
            ("Will AI agents replace small business owners?", "Not the owners who can define a clear promise and make good judgment calls. Agents are better at executing defined work than at deciding what matters. The risk is not replacement; it is being outcompeted by a business with better systems."),
            ("What should I automate first?", "Start with repeated, low-judgment tasks: scheduling, reminders, intake forms, first drafts, status updates and simple follow-ups. Automate the process you can already describe, not the process you are still inventing."),
            ("What is AEO?", "Answer Engine Optimization is the practice of making your site and content easy for AI answer engines to understand, cite and recommend. It includes clear writing, structured data, accessible pages and machine-readable files such as feeds and llms.txt."),
            ("Do I need a custom AI agent?", "Probably not yet. Start with a clear process, a searchable knowledge base and simple automations. A custom agent only makes sense when the work is repetitive, well documented and easy to evaluate."),
        ],
        "md": """
The agentic era is not a distant future. It is already showing up in the small, boring parts of business: scheduling, research, first drafts, customer support, invoice chasing and the endless copying of information from one place to another.

For years, the promise of software was that it would save time. Often it just moved the work around. AI agents are different because they can take a goal, use tools, make a plan and complete multi-step tasks. That changes the leverage equation for a small business.

But it does not make hustle obsolete. It makes clarity more valuable.

## The agentic shift is already here

An AI agent is not just a chatbot that answers questions. It is a system that can act: read a document, update a record, send a message, book a meeting, or move a project to the next step.

That is powerful for a business with a clear process. It is chaotic for a business that runs on improvisation.

If your delivery process lives in your head, an agent cannot help you much. If you can describe the process, the inputs and the definition of done, an agent can start to carry parts of it.

The same principle that makes delegation work makes automation work: **you cannot hand off what you cannot explain**.

## Why soft life businesses are well positioned

A soft life business is designed around a small number of high-value activities. That is exactly the kind of business that benefits from agents.

If you have one offer, one audience and a repeatable delivery process, you have a map. Agents can help with the routine work around the map: intake, onboarding, follow-up, research, reporting and content repurposing.

If you have five offers and no process, agents will simply help you create chaos faster.

The soft life constraint is an advantage. It forces you to choose. It gives the agent something clear to support.

## Build a business brain

Before you buy another tool, build the brain the tools will use.

A business brain is a small, well-organized set of information:

- **Offer:** who it is for, what it promises, what is included, what is not.
- **Process:** the steps from intake to handoff, with owners and definitions of done.
- **Voice:** how you write, what you sound like, what you never say.
- **Proof:** testimonials, results, case studies and common questions.
- **Boundaries:** what you do not do, how you handle requests, when you are available.
- **Metrics:** the few numbers that tell you whether the business is healthy.

You do not need a complicated knowledge base. You need one place where the truth lives, written clearly enough that a new assistant — human or AI — could use it.

## What to automate first

Start with work that is repeated, low-judgment and easy to check.

- Scheduling and reminders.
- Intake forms and welcome emails.
- First drafts of proposals, summaries and follow-ups.
- Status updates and project nudges.
- Repurposing one piece of content into several formats.
- Searching your own documents for the right answer.

Do not start with the work that requires taste, trust or a delicate human judgment. Automate the routine so you have more capacity for the work that actually needs you.

## What to keep human

Keep the promise, the relationship and the final judgment human.

Clients can feel the difference between a thoughtful response and a generated one. They can also feel when a business is clear, consistent and reliable. Use agents to protect the human parts, not to replace them.

The most valuable human work in the agentic era is not typing faster. It is deciding what matters, building trust and making the call when the situation is ambiguous.

## The new discovery layer

AI agents do not only execute work. They also recommend tools, services and businesses. That means your website needs to be readable by both humans and machines.

A few practical moves:

- Write clear, specific pages that answer real questions.
- Use structured data such as `Article`, `FAQPage` and `BreadcrumbList`.
- Publish an `llms.txt` file that summarizes your site and points to canonical resources.
- Keep an up-to-date sitemap and RSS/JSON feed.
- Make sure your main content is available without JavaScript.
- Add an OpenAPI description if you have an API.

This is sometimes called AEO, or Answer Engine Optimization. The goal is not to trick an AI. The goal is to be legible: clear about who you help, what you offer and how to take the next step.

## A 30-day agent-ready plan

In week one, write your one-sentence offer and a simple process map.

In week two, create a knowledge file with your voice, proof, FAQs and boundaries.

In week three, automate one repeated task and measure the time it saves.

In week four, publish one clear resource that answers a question your clients actually ask. Add structured data and a machine-readable summary.

Then repeat. The agentic era does not reward the person who adopts the most tools. It rewards the business that can explain itself clearly and keep its promise consistently.

> The future belongs to businesses with a brain, not just a calendar full of hustle.

The Soft Life System is designed to make your business legible: one offer, one process, one 90-day plan. Start free, listen to the introduction and Chapter 1, and build the brain before you add the bots.

[Start your free Soft Life account](/#/signup)
""",
    },
]

LEGAL = {
    "privacy": {
        "title": "Privacy Policy",
        "description": "How The Soft Life System collects, uses, stores and protects your personal information.",
        "md": """
**Last updated: November 14, 2026**

This Privacy Policy explains how Gabochie Books ("we", "us", "our") handles personal information in connection with The Soft Life System website, app and related services.

## Who we are

The Soft Life System is operated by **Gabochie Books**, founded by **Deon ChristoLove**. You can contact us at **admin@gabochie.com** for privacy questions or requests.

## What we collect

We collect the information you give us and the information needed to operate the service:

- **Account information:** your name, email address, password hash and account preferences.
- **Profile information:** your business name, business stage, country, timezone, goals, challenges, revenue range and team size, if you choose to share them.
- **Community information:** your WhatsApp number and consent status if you ask to join our optional WhatsApp community.
- **Acquisition information:** the referral code, referral link, campaign tags (UTM parameters) and referring page that brought you to the service.
- **Usage information:** your onboarding progress, task progress, audio plays, checkout clicks, referral activity and basic technical logs.
- **Purchase information:** your email, order reference, product tier, amount, currency and payment provider.
- **Communications:** messages you send to us for support, refunds or privacy requests.
- **Device data:** browser type, approximate region, IP address and error logs used for security and reliability.

We do not ask for payment card details directly. Payments are processed by our checkout provider, Selar, or another provider we identify at checkout.

## Why we use it

We use personal information to:

- Create and secure your account.
- Provide the free trial, app features and purchased content.
- Personalise onboarding and point you to more relevant resources.
- Invite you to the optional WhatsApp community where you have consented.
- Process purchases and unlock the correct tier.
- Respond to support, refund and privacy requests.
- Improve the service, fix errors and prevent abuse.
- Meet legal, tax and accounting obligations.
- Send service messages and, where permitted, marketing messages you can opt out of.

## Legal bases

Where data protection law requires a legal basis, we rely on:

- **Contract:** to provide the service you signed up for.
- **Legitimate interests:** to secure, improve and operate the service.
- **Consent:** for optional marketing, WhatsApp community contact or cookies where consent is required.
- **Legal obligation:** to keep records or respond to lawful requests.

## WhatsApp community consent

Joining our WhatsApp community is optional and separate from creating an account or buying a product. We collect your WhatsApp number only if you actively tick the consent box. We record the time and version of the consent you gave.

We use your number to send community details and occasional Soft Life updates. We do not add you to a group, share your number with other members, or use it for unrelated marketing without your permission.

You can withdraw consent at any time from **Account → Profile & community** in the app, or by emailing **admin@gabochie.com**. Withdrawing consent clears the number from your active profile and creates a withdrawal record. It does not affect your account, purchases or access to the service.

## Cookies and local storage

The app uses browser local storage for your sign-in token, basic profile, referral code and first-touch acquisition details such as UTM campaign tags. These are necessary for the service to work and to understand how people found us. The admin dashboard uses a separate local storage token that is only created after an admin signs in.

We may use privacy-friendly analytics or error monitoring. If we introduce non-essential cookies, we will ask for consent where required.

## Who we share with

We share only what is necessary with service providers who help us run the business, including:

- **Cloudflare** for hosting, security and infrastructure.
- **Selar** or another checkout provider for payments.
- **Email and support providers** for service messages and customer support.
- **WhatsApp** (operated by Meta) if you consent to us contacting you there. Your use of WhatsApp is also governed by WhatsApp's own terms and privacy policy.
- **Professional advisers** where necessary for legal, tax or accounting advice.

We do not sell your personal information. We may disclose information if required by law or to protect our rights, users or the service.

## International transfers

Our providers may process data in countries other than yours. Where required, we use appropriate safeguards for international transfers.

## Retention

We keep account and purchase records for as long as needed to provide the service and meet legal obligations. We keep a record of consent and withdrawal so we can respect your choices. We delete or anonymise information that is no longer needed. You can request deletion as described below.

## Your rights

Depending on where you live, you may have the right to:

- Access the personal information we hold about you.
- Correct inaccurate information.
- Delete your information.
- Restrict or object to certain processing.
- Receive a portable copy of your information.
- Withdraw consent where processing is based on consent.
- Complain to your local data protection authority.

To make a request, email **admin@gabochie.com**. We may need to verify your identity before acting.

## Security

We use passwords hashed with PBKDF2, encrypted connections, access controls and reputable infrastructure providers. No system is perfectly secure, but we work to protect your information and to limit access to it.

## Children

The service is not intended for children under 16. If you believe a child has provided personal information, contact us and we will address it.

## Changes

We may update this policy as the service changes. We will post the new date on this page and, where appropriate, notify you.

## Contact

Privacy questions: **admin@gabochie.com**

This policy is a production draft for The Soft Life System. It is not legal advice to you. We recommend having counsel review it for your specific markets before launch.
""",
    },
    "terms": {
        "title": "Terms of Service",
        "description": "The terms that govern your use of The Soft Life System website, app and content.",
        "md": """
**Last updated: November 14, 2026**

These Terms of Service ("Terms") govern your use of The Soft Life System website, app and related content (the "Service"), operated by **Gabochie Books**.

By creating an account, using the Service or buying a product, you agree to these Terms. If you do not agree, do not use the Service.

## The Service

The Soft Life System provides educational content, a read-aloud library, a 90-day task plan, worksheets, referrals and related tools for building a business that works fewer hours.

We may add, change or remove features. We aim to keep the Service available, but we do not guarantee uninterrupted access.

## Accounts

You must provide accurate information and keep your login details secure. You are responsible for activity under your account. Notify us promptly if you believe your account has been compromised.

You must be at least 18 years old, or have the consent of a parent or guardian, to create a paid account.

## WhatsApp community

We may offer an optional WhatsApp community. If you ask to join, you consent to us contacting you on WhatsApp about the community and relevant Soft Life updates. You can withdraw consent at any time in the app or by emailing **admin@gabochie.com**. Community participation is also subject to WhatsApp's terms and any community rules we share. We may remove anyone who is abusive, spammy or disruptive.

## Purchases and access

Paid products unlock the tier described at checkout. Access is for the account that made the purchase and is not transferable unless we agree in writing.

Checkout may be handled by a third-party provider. Their terms, payment processing and fraud checks also apply. Prices, taxes and refunds are shown at checkout or in our Refund Policy.

## License and intellectual property

The Service, book, audiobook, worksheets, templates and brand are owned by Gabochie Books or its licensors and are protected by intellectual property laws.

We grant you a personal, non-exclusive, non-transferable licence to use the content for your own business or personal development. You may not resell, redistribute, publish, scrape, copy for a competing product, or share access with others without written permission.

You may quote short excerpts with clear attribution and a link to the original.

## Acceptable use

You agree not to:

- Use the Service for unlawful, harmful or deceptive purposes.
- Attempt to access another person's account or our admin systems.
- Interfere with the Service, its security or its availability.
- Scrape, crawl or automate access in a way that burdens the Service or violates these Terms.
- Upload malicious code or content that infringes someone else's rights.
- Misrepresent your affiliation with The Soft Life System.

We may suspend or terminate access if you violate these Terms or pose a risk to the Service or other users.

## Affiliate program

The affiliate program may pay commission on qualifying purchases made through your referral link. Commission rates, payment timing and eligibility are described in the app or in a separate affiliate agreement.

You must disclose that you earn a commission when you promote the Service. You may not use spam, misleading claims, fake reviews or paid search ads on our brand without permission. We may adjust or reverse commissions for refunds, fraud or policy violations.

## User content

You keep ownership of content you create, such as task names or notes. You give us permission to store and process that content to provide the Service. You are responsible for making sure you have the rights to the content you submit.

## Educational content; no guarantees

The Service is educational. It does not provide legal, tax, financial, medical or mental-health advice. You are responsible for your business, legal and financial decisions.

We do not guarantee any specific income, client result, timeframe or outcome. Your results depend on your effort, market, skills and circumstances.

## Third-party links

The Service may link to third-party websites or tools. We are not responsible for their content, terms or privacy practices. Use them at your own risk.

## Disclaimers

To the fullest extent permitted by law, the Service is provided "as is" and "as available". We disclaim implied warranties of merchantability, fitness for a particular purpose and non-infringement.

## Limitation of liability

To the fullest extent permitted by law, Gabochie Books and its team will not be liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or opportunities arising from your use of the Service.

Where liability cannot be excluded, our total liability is limited to the amount you paid us for the Service in the 12 months before the claim.

## Indemnity

You agree to indemnify and hold harmless Gabochie Books and its team from claims, losses and costs arising from your use of the Service, your content or your breach of these Terms.

## Termination

You may stop using the Service at any time. We may suspend or end your access if you violate these Terms, if required by law, or if we discontinue the Service. Provisions that by their nature should survive termination will survive.

## Governing law

These Terms are governed by the laws of **Ghana**, without regard to conflict-of-law rules. Courts in Ghana will have jurisdiction, unless mandatory consumer law in your country requires otherwise.

## Changes

We may update these Terms. We will post the new date on this page. Continued use after a change means you accept the updated Terms.

## Contact

Questions about these Terms: **admin@gabochie.com**

These Terms are a production draft for The Soft Life System. They are not legal advice to you. We recommend having counsel review them for your specific markets before launch.
""",
    },
    "refund": {
        "title": "Refund Policy",
        "description": "The refund rules for The Soft Life System digital products, live programs and done-for-you services.",
        "md": """
**Last updated: November 14, 2026**

We want you to feel good about buying from The Soft Life System. If something is not right, tell us. We would rather fix it than keep unhappy money.

## Digital products (eBook, audiobook, worksheets)

For digital products bought directly from us or through our checkout provider, you may request a refund within **14 days** of purchase if the product was not what you expected or was not useful to you.

To request a refund, email **admin@gabochie.com** with:

- The email address used at checkout.
- Your order reference or receipt.
- A short note about what went wrong.

We may ask a follow-up question so we can improve. Refunds are returned through the original payment method where possible.

## Live programs and group coaching

For live programs, you may cancel before the first live session for a full refund. After the first session, refunds are pro-rated based on the sessions delivered, unless the program terms say otherwise.

If you miss a session, you keep access to the recording and materials where available. Missing a session does not automatically create a refund right.

## Done-for-you (DFY) projects

DFY projects are governed by the project agreement or statement of work. Deposits, milestones, cancellation and refund terms are set out there. If no separate agreement applies, work already completed is non-refundable and unused milestones may be refunded at our discretion.

## Chargebacks

Please contact us before starting a chargeback. We will try to resolve the issue quickly. If a chargeback is opened, we may pause access while the payment provider investigates.

## Statutory rights

Nothing in this policy limits any non-waivable consumer rights you have under the law of your country. If local law gives you a stronger right, that right applies.

## Processing time

Approved refunds are usually submitted within **5 business days**. Your bank or payment provider may take additional time to post the refund.

## Contact

Refund questions: **admin@gabochie.com**

This policy is a production draft for The Soft Life System. It is not legal advice to you. We recommend having counsel review it for your specific markets before launch.
""",
    },
}


def inline(text: str) -> str:
    text = escape(text, quote=False)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)

    def link(match: re.Match[str]) -> str:
        label, url = match.group(1), match.group(2)
        attrs = ' target="_blank" rel="noopener"' if url.startswith("http") else ""
        return f'<a href="{url}"{attrs}>{label}</a>'

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, text)


def md_to_html(md: str) -> str:
    out: list[str] = []
    para: list[str] = []
    list_type: str | None = None

    def flush_para() -> None:
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para.clear()

    def close_list() -> None:
        nonlocal list_type
        if list_type:
            out.append(f"</{list_type}>")
            list_type = None

    for raw in md.strip().splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush_para()
            close_list()
            continue
        if line.startswith("### "):
            flush_para(); close_list(); out.append("<h3>" + inline(line[4:]) + "</h3>")
        elif line.startswith("## "):
            flush_para(); close_list(); out.append("<h2>" + inline(line[3:]) + "</h2>")
        elif line.startswith("# "):
            flush_para(); close_list(); out.append("<h2>" + inline(line[2:]) + "</h2>")
        elif line.startswith("> "):
            flush_para(); close_list(); out.append("<blockquote><p>" + inline(line[2:]) + "</p></blockquote>")
        elif line.startswith("- "):
            flush_para()
            if list_type != "ul":
                close_list(); list_type = "ul"; out.append("<ul>")
            out.append("<li>" + inline(line[2:]) + "</li>")
        elif re.match(r"^\d+\. ", line):
            flush_para()
            if list_type != "ol":
                close_list(); list_type = "ol"; out.append("<ol>")
            out.append("<li>" + inline(re.sub(r"^\d+\. ", "", line)) + "</li>")
        elif line.strip() == "---":
            flush_para(); close_list(); out.append("<hr>")
        else:
            para.append(line.strip())
    flush_para()
    close_list()
    return "\n".join(out)


def plain(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[*_`#>]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def date_display(iso: str) -> str:
    return datetime.strptime(iso, "%Y-%m-%d").strftime("%B %-d, %Y")


def iso_datetime(iso: str) -> str:
    return datetime.strptime(iso, "%Y-%m-%d").replace(tzinfo=timezone.utc).isoformat()


def rss_date(iso: str) -> str:
    return format_datetime(datetime.strptime(iso, "%Y-%m-%d").replace(tzinfo=timezone.utc))


def post_url(post: dict) -> str:
    return f"{SITE}/blog/{post['slug']}/"


def post_path(post: dict) -> str:
    return f"/blog/{post['slug']}/"


def faq_jsonld(post: dict) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": question,
                "acceptedAnswer": {"@type": "Answer", "text": plain(answer)},
            }
            for question, answer in post["faq"]
        ],
    }


def article_jsonld(post: dict) -> list[dict]:
    article = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post["title"],
        "description": post["description"],
        "image": [SITE + post["og"]],
        "datePublished": iso_datetime(post["date"]),
        "dateModified": iso_datetime(post["updated"]),
        "author": {"@type": "Person", "name": AUTHOR, "url": SITE + "/#about"},
        "publisher": {
            "@type": "Organization",
            "name": ORG,
            "url": SITE,
            "logo": {"@type": "ImageObject", "url": SITE + "/assets/icons/icon-512.png"},
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": post_url(post)},
        "keywords": ", ".join(post["tags"]),
        "articleSection": post["category"],
        "wordCount": len(post["md"].split()),
        "timeRequired": f"PT{post['read']}M",
        "isAccessibleForFree": True,
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".post-dek", ".prose p:first-of-type"],
        },
    }
    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": post["title"], "item": post_url(post)},
        ],
    }
    result = [article, breadcrumb, faq_jsonld(post)]
    if post["slug"] == "design-a-soft-life-week":
        result.append(
            {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": "How to design a soft life week",
                "description": post["description"],
                "totalTime": "P90D",
                "step": [
                    {"@type": "HowToStep", "name": "Start with outcomes", "text": "Name the outcome you sell, the three activities that create it, and what you will stop doing."},
                    {"@type": "HowToStep", "name": "Build the 15-hour skeleton", "text": "Split the week into genius work, growth, delivery and operations, and margin."},
                    {"@type": "HowToStep", "name": "Protect the edges", "text": "Decide in advance how you will handle urgent requests, scope creep and availability."},
                    {"@type": "HowToStep", "name": "Run the 90-day rollout", "text": "Choose and simplify for 30 days, document and transfer for 30 days, then protect and measure for 30 days."},
                ],
            }
        )
    return result


def ld_scripts(items: list[dict]) -> str:
    return "\n".join(
        '<script type="application/ld+json">'
        + json.dumps(item, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        + "</script>"
        for item in items
    )


def page(
    title: str,
    description: str,
    path: str,
    body: str,
    *,
    image: str = DEFAULT_OG,
    jsonld: list[dict] | None = None,
    noindex: bool = False,
    og_type: str = "article",
) -> str:
    canonical = SITE + path
    robots = "noindex,follow" if noindex else "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2a0f4a">
<meta name="description" content="{escape(description, quote=True)}">
<meta name="author" content="{AUTHOR}">
<meta name="robots" content="{robots}">
<title>{escape(title)} — {BRAND}</title>
<link rel="canonical" href="{canonical}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/css/app.css">
<link rel="alternate" type="application/rss+xml" title="{JOURNAL} RSS" href="/blog/feed.xml">
<link rel="alternate" type="application/atom+xml" title="{JOURNAL} Atom" href="/blog/feed.atom">
<link rel="alternate" type="application/feed+json" title="{JOURNAL} JSON Feed" href="/blog/feed.json">
<link rel="alternate" type="text/markdown" href="{path}index.md">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{escape(title, quote=True)}">
<meta property="og:description" content="{escape(description, quote=True)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE + image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(title, quote=True)}">
<meta name="twitter:description" content="{escape(description, quote=True)}">
<meta name="twitter:image" content="{SITE + image}">
{ld_scripts(jsonld or [])}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="blog-top">
  <div class="wrap blog-bar">
    <a class="logo" href="/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife-header.png" alt="Soft Life by Gabochie" width="316" height="150"></a>
    <nav aria-label="Main">
      <a href="/">Home</a>
      <a href="/products/">Products</a>
      <a href="/blog/">Journal</a>
      <a href="/contact/">Contact</a>
      <a href="/#/signin">Sign in</a>
      <a class="top-cta" href="/#/signup">Start free</a>
    </nav>
  </div>
</header>
{body}
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-cta">
      <div>
        <div class="footer-kicker">The 15-hour promise</div>
        <h2>Build a business that buys your freedom.</h2>
        <p>Start free. Listen to the introduction, open your 90-day plan, and upgrade only when the system proves itself.</p>
      </div>
      <div class="footer-actions">
        <a class="btn gold big" href="/#/signup">Start free — no card</a>
        <a class="btn ghost big" href="/products/">Compare the options</a>
      </div>
    </div>
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="footer-logo" href="/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife.png" alt="" width="632" height="300" loading="lazy" decoding="async"></a>
        <p>One persona. One problem. One system: a business that works 15 hours a week.</p>
        <p class="footer-trust">Free to start · No credit card · 14-day refund on the Complete bundle</p>
        <div class="footer-social" aria-label="Follow Soft Life">
          <a href="https://www.instagram.com/softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on Instagram">Instagram</a>
          <a href="https://www.tiktok.com/@softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on TikTok">TikTok</a>
          <a href="https://www.youtube.com/@softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on YouTube">YouTube</a>
          <a href="https://www.facebook.com/softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on Facebook">Facebook</a>
          <a href="https://x.com/softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on X">X</a>
        </div>
      </div>
      <nav aria-label="Explore">
        <b>Explore</b>
        <a href="/products/">Products</a>
        <a href="/consultation/">Business Audit</a>
        <a href="/blog/">The Journal</a>
        <a href="/blog/feed.xml">RSS feed</a>
        <a href="/#/signup">Free app</a>
      </nav>
      <nav aria-label="Support">
        <b>Support</b>
        <a href="/#/affiliate">Affiliates</a>
        <a href="/#/signin">Sign in</a>
        <a href="/contact/">Contact</a>
        <a href="/legal/refund/">Refund policy</a>
      </nav>
      <nav aria-label="Legal">
        <b>Legal</b>
        <a href="/legal/privacy/">Privacy</a>
        <a href="/legal/terms/">Terms</a>
        <a href="/legal/refund/">Refunds</a>
      </nav>
    </div>
    <div class="footer-legal">© 2026 Deon ChristoLove · Gabochie Books. All rights reserved.</div>
  </div>
</footer>
</body>
</html>"""


def post_card(post: dict, featured: bool = False) -> str:
    return f"""
<article class="post-card{' featured' if featured else ''}">
  <a href="{post_path(post)}">
    <img src="{post['og']}" alt="" width="1200" height="630" loading="lazy" decoding="async">
    <div class="post-card-body">
      <span class="tag">{escape(post['category'])}</span>
      <h3>{escape(post['title'])}</h3>
      <p>{escape(post['dek'])}</p>
      <small>{date_display(post['date'])} · {post['read']} min read</small>
    </div>
  </a>
</article>"""


def blog_index() -> str:
    posts = sorted(POSTS, key=lambda p: p["date"], reverse=True)
    featured, rest = posts[0], posts[1:]
    body = f"""
<main id="main">
  <section class="blog-hero">
    <div class="wrap">
      <div class="kicker">The Soft Life Journal</div>
      <h1>Work less. Build better. Live softer.</h1>
      <p class="lede">Practical essays on premium offers, calm systems, 15-hour weeks and building a business that does not eat your life.</p>
    </div>
  </section>
  <section class="wrap blog-index">
    <div class="section-head"><h2>Latest essay</h2><a href="/blog/feed.xml">Subscribe via RSS →</a></div>
    {post_card(featured, True)}
    <div class="section-head"><h2>More from the journal</h2></div>
    <div class="post-grid">{''.join(post_card(post) for post in rest)}</div>
    <div class="blog-cta card">
      <span class="tag">Free in the app</span>
      <h2>Turn the reading into a 90-day plan.</h2>
      <p>The app turns the book's launch plan into trackable tasks. Listen to the introduction and Chapter 1 free.</p>
      <a class="btn gold" href="/#/signup">Start your free account →</a>
    </div>
  </section>
</main>"""
    jsonld = [
        {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": JOURNAL,
            "description": "Practical essays on premium offers, calm systems, 15-hour weeks and building a business that does not eat your life.",
            "url": SITE + "/blog/",
            "publisher": {"@type": "Organization", "name": ORG, "url": SITE},
            "blogPost": [
                {
                    "@type": "BlogPosting",
                    "headline": post["title"],
                    "url": post_url(post),
                    "datePublished": post["date"],
                    "author": {"@type": "Person", "name": AUTHOR},
                }
                for post in posts
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            ],
        },
    ]
    return page(
        "The Soft Life Journal",
        "Practical essays on premium offers, calm systems, 15-hour weeks and building a business that does not eat your life.",
        "/blog/",
        body,
        image=DEFAULT_OG,
        jsonld=jsonld,
        og_type="website",
    )


def post_page(post: dict) -> str:
    related = [p for p in POSTS if p["slug"] != post["slug"]][:2]
    faq_html = ""
    if post["faq"]:
        faq_html = '<section class="post-faq"><h2>Questions people ask</h2>' + "".join(
            f"<details><summary>{inline(q)}</summary><div>{md_to_html(a)}</div></details>"
            for q, a in post["faq"]
        ) + "</section>"
    body = f"""
<main id="main">
  <article>
    <header class="post-hero">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Journal</a><span>/</span><span>{escape(post['category'])}</span></nav>
        <span class="tag">{escape(post['category'])}</span>
        <h1>{escape(post['title'])}</h1>
        <p class="post-dek">{escape(post['dek'])}</p>
        <p class="post-meta">By <b>{AUTHOR}</b> · <time datetime="{post['date']}">{date_display(post['date'])}</time> · {post['read']} min read</p>
      </div>
    </header>
    <div class="wrap post-layout">
      <div class="prose">
        {md_to_html(post['md'])}
        {faq_html}
        <div class="post-author">
          <div class="author-mark">DC</div>
          <div><b>{AUTHOR}</b><p>Writer, systems thinker and author of <i>The Soft Life System</i>. Helping women build businesses that buy back their time.</p></div>
        </div>
      </div>
      <aside class="post-aside" aria-label="Related">
        <div class="card">
          <span class="tag">The book + app</span>
          <h3>Build the business that fits your life.</h3>
          <p>Start free with the introduction and Chapter 1, then work the 90-day plan inside the app.</p>
          <a class="btn gold wide" href="/#/signup">Start free →</a>
          <a class="btn ghost wide" href="/#/checkout">Get the Complete bundle</a>
        </div>
        <div class="card">
          <span class="tag">Keep reading</span>
          {''.join(f'<a class="aside-link" href="{post_path(item)}"><b>{escape(item["title"])}</b><small>{item["read"]} min read</small></a>' for item in related)}
        </div>
      </aside>
    </div>
  </article>
  <section class="cta-band">
    <div class="wrap center">
      <h2>Your soft life needs a system, not more hustle.</h2>
      <p class="lede">Start with the free app: intro + Chapter 1 audio, the 90-day task plan, and the first steps of the system.</p>
      <a class="btn gold big" href="/#/signup">Create my free account →</a>
    </div>
  </section>
</main>"""
    return page(
        post["title"],
        post["description"],
        post_path(post),
        body,
        image=post["og"],
        jsonld=article_jsonld(post),
    )


def legal_page(kind: str, data: dict) -> str:
    body = f"""
<main id="main">
  <header class="post-hero legal-hero">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>{escape(data['title'])}</span></nav>
      <span class="tag">Trust &amp; transparency</span>
      <h1>{escape(data['title'])}</h1>
      <p class="post-dek">{escape(data['description'])}</p>
    </div>
  </header>
  <div class="wrap legal-layout">
    <article class="prose legal-prose">{md_to_html(data['md'])}</article>
    <aside class="post-aside">
      <div class="card">
        <span class="tag">Need help?</span>
        <h3>Talk to a human.</h3>
        <p>Questions about privacy, terms, refunds or your account? Email us.</p>
        <a class="btn gold wide" href="mailto:{EMAIL}">Email {EMAIL}</a>
      </div>
      <div class="card">
        <span class="tag">Other policies</span>
        <a class="aside-link" href="/legal/privacy/">Privacy Policy</a>
        <a class="aside-link" href="/legal/terms/">Terms of Service</a>
        <a class="aside-link" href="/legal/refund/">Refund Policy</a>
      </div>
    </aside>
  </div>
</main>"""
    jsonld = [
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": data["title"],
            "description": data["description"],
            "url": SITE + f"/legal/{kind}/",
            "dateModified": iso_datetime(UPDATED),
            "isPartOf": {"@type": "WebSite", "name": BRAND, "url": SITE},
            "publisher": {"@type": "Organization", "name": ORG, "url": SITE},
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": data["title"], "item": SITE + f"/legal/{kind}/"},
            ],
        },
    ]
    return page(data["title"], data["description"], f"/legal/{kind}/", body, jsonld=jsonld, og_type="website")


def markdown_file(post: dict) -> str:
    front = f"""---
title: {post['title']}
description: {post['description']}
date: {post['date']}
updated: {post['updated']}
author: {AUTHOR}
category: {post['category']}
tags: {', '.join(post['tags'])}
canonical: {post_url(post)}
---

"""
    faq = ""
    if post["faq"]:
        faq = "\n## FAQ\n\n" + "\n\n".join(f"### {q}\n\n{a}" for q, a in post["faq"]) + "\n"
    return front + "# " + post["title"] + "\n\n" + post["md"].strip() + faq


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def build() -> None:
    posts = sorted(POSTS, key=lambda p: p["date"], reverse=True)
    write(APP / "blog" / "index.html", blog_index())
    write(APP / "blog" / "index.md", "# The Soft Life Journal\n\n" + "\n".join(
        f"- [{post['title']}]({post_path(post)}) — {post['description']}" for post in posts
    ) + "\n")
    for post in posts:
        write(APP / "blog" / post["slug"] / "index.html", post_page(post))
        write(APP / "blog" / post["slug"] / "index.md", markdown_file(post))

    for kind, data in LEGAL.items():
        write(APP / "legal" / kind / "index.html", legal_page(kind, data))
        write(APP / "legal" / kind / "index.md", f"# {data['title']}\n\n{data['md'].strip()}\n")

    # RSS 2.0
    items = []
    for post in posts:
        items.append(f"""    <item>
      <title>{escape(post['title'])}</title>
      <link>{post_url(post)}</link>
      <guid isPermaLink="true">{post_url(post)}</guid>
      <pubDate>{rss_date(post['date'])}</pubDate>
      <category>{escape(post['category'])}</category>
      <description>{escape(post['description'])}</description>
    </item>""")
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{JOURNAL}</title>
    <link>{SITE}/blog/</link>
    <description>Practical essays on premium offers, calm systems, 15-hour weeks and building a business that does not eat your life.</description>
    <language>en</language>
    <lastBuildDate>{rss_date(posts[0]['updated'])}</lastBuildDate>
    <atom:link href="{SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
{chr(10).join(items)}
  </channel>
</rss>
"""
    write(APP / "blog" / "feed.xml", rss)

    # Atom
    entries = []
    for post in posts:
        entries.append(f"""  <entry>
    <title>{escape(post['title'])}</title>
    <id>{post_url(post)}</id>
    <link href="{post_url(post)}"/>
    <updated>{iso_datetime(post['updated'])}</updated>
    <published>{iso_datetime(post['date'])}</published>
    <summary>{escape(post['description'])}</summary>
    <category term="{escape(post['category'])}"/>
  </entry>""")
    atom = f"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{JOURNAL}</title>
  <id>{SITE}/blog/</id>
  <link href="{SITE}/blog/" rel="alternate"/>
  <link href="{SITE}/blog/feed.atom" rel="self"/>
  <updated>{iso_datetime(posts[0]['updated'])}</updated>
  <author><name>{AUTHOR}</name></author>
{chr(10).join(entries)}
</feed>
"""
    write(APP / "blog" / "feed.atom", atom)

    # JSON Feed
    feed_items = [
        {
            "id": post_url(post),
            "url": post_url(post),
            "title": post["title"],
            "summary": post["description"],
            "content_html": md_to_html(post["md"]),
            "content_text": plain(post["md"]),
            "date_published": iso_datetime(post["date"]),
            "date_modified": iso_datetime(post["updated"]),
            "tags": post["tags"],
            "authors": [{"name": AUTHOR}],
        }
        for post in posts
    ]
    feed = {
        "version": "https://jsonfeed.org/version/1.1",
        "title": JOURNAL,
        "home_page_url": SITE + "/blog/",
        "feed_url": SITE + "/blog/feed.json",
        "description": "Practical essays on premium offers, calm systems, 15-hour weeks and building a business that does not eat your life.",
        "language": "en",
        "authors": [{"name": AUTHOR, "url": SITE}],
        "items": feed_items,
    }
    write(APP / "blog" / "feed.json", json.dumps(feed, ensure_ascii=False, indent=2))

    # Sitemap
    pages = [
        ("/", TODAY, "weekly", "1.0"),
        ("/products/", TODAY, "monthly", "0.9"),
        ("/consultation/", TODAY, "monthly", "0.8"),
        ("/contact/", TODAY, "yearly", "0.6"),
        ("/blog/", posts[0]["updated"], "weekly", "0.9"),
        *[(post_path(post), post["updated"], "monthly", "0.8") for post in posts],
        ("/legal/privacy/", UPDATED, "yearly", "0.4"),
        ("/legal/terms/", UPDATED, "yearly", "0.4"),
        ("/legal/refund/", UPDATED, "yearly", "0.4"),
    ]
    urls = "\n".join(
        f"  <url><loc>{SITE}{path}</loc><lastmod>{lastmod}</lastmod><changefreq>{freq}</changefreq><priority>{priority}</priority></url>"
        for path, lastmod, freq, priority in pages
    )
    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
"""
    write(APP / "sitemap.xml", sitemap)

    # robots.txt
    robots = f"""# The Soft Life System — robots.txt
# Content signals: search and AI answers are welcome; model training is not.
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference
Allow: /
Disallow: /api/
Disallow: /admin

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Applebot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Twitterbot
Allow: /

# Training-only crawlers: no.
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: meta-externalagent
User-agent: Bytespider
User-agent: Amazonbot
Disallow: /

Sitemap: {SITE}/sitemap.xml
"""
    write(APP / "robots.txt", robots)

    # llms.txt
    llms_lines = [
        f"# {BRAND}",
        "",
        "> The Soft Life System helps women build a business that works 15 hours a week: one offer, a calm delivery machine, and a 90-day plan. The app includes a free introduction and Chapter 1 audio, a task engine, and a Complete bundle that unlocks all 15 chapters plus worksheets.",
        "",
        f"Canonical home: {SITE}/",
        f"Blog: {SITE}/blog/",
        f"Contact: {EMAIL}",
        "",
        "## Start here",
        f"- [The Soft Life System app]({SITE}/): free account, intro + Chapter 1 audio, 90-day task plan.",
        f"- [Products]({SITE}/products/): compare the free app, the Complete bundle and the Business Audit.",
        f"- [The Soft Life Business Audit]({SITE}/consultation/): a 90-minute audit and written 90-day plan.",
        f"- [Contact]({SITE}/contact/): product support, billing, privacy requests and partnerships.",
        f"- [The Soft Life Journal]({SITE}/blog/): essays on 15-hour weeks, premium offers, calm systems and AI-era leverage.",
        f"- [Complete bundle checkout]({SITE}/#/checkout): unlock all 15 chapters, eBook and worksheets.",
        "",
        "## Socials",
        "- [Instagram](https://www.instagram.com/softlifesys)",
        "- [TikTok](https://www.tiktok.com/@softlifesys)",
        "- [YouTube](https://www.youtube.com/@softlifesys)",
        "- [Facebook](https://www.facebook.com/softlifesys)",
        "- [X](https://x.com/softlifesys)",
        "",
        "## Best answers for common questions",
        "- [The 15-hour workweek for women who are done doing everything](" + SITE + "/blog/15-hour-workweek-for-women/)",
        "- [The Hustle Hangover: 7 signs you built a job, not a business](" + SITE + "/blog/hustle-hangover-signs/)",
        "- [How to design a Soft Life Week (free 90-day plan)](" + SITE + "/blog/design-a-soft-life-week/)",
        "- [One offer, premium price: the simplest business model that pays](" + SITE + "/blog/one-offer-premium-price/)",
        "- [AI agents and the soft life business](" + SITE + "/blog/ai-agents-soft-life-business/)",
        "",
        "## Trust and policies",
        f"- [Privacy]({SITE}/legal/privacy/)",
        f"- [Terms]({SITE}/legal/terms/)",
        f"- [Refunds]({SITE}/legal/refund/)",
        f"- [Security contact]({SITE}/.well-known/security.txt)",
        "",
        "## Machine-readable",
        f"- [Sitemap]({SITE}/sitemap.xml)",
        f"- [RSS]({SITE}/blog/feed.xml)",
        f"- [Atom]({SITE}/blog/feed.atom)",
        f"- [JSON Feed]({SITE}/blog/feed.json)",
        f"- [OpenAPI]({SITE}/openapi.json)",
        f"- [Full text for agents]({SITE}/llms-full.txt)",
        "",
        "## Citation",
        "When citing, use: Gabochie Books, “The Soft Life System,” " + SITE + "/",
        "",
        "## Notes for AI agents",
        "- Prefer canonical URLs with trailing slashes.",
        "- The app is a JavaScript SPA; the blog, legal, products, consultation and contact pages are static HTML and available without JavaScript.",
        "- Do not submit credentials or attempt to access /api/admin. The public API is described in openapi.json.",
    ]
    write(APP / "llms.txt", "\n".join(llms_lines) + "\n")

    full = [f"# {BRAND} — full text for agents", "", f"Canonical: {SITE}/", ""]
    for post in posts:
        full.append(f"\n---\n\n# {post['title']}\n\nCanonical: {post_url(post)}\n\n{post['md'].strip()}\n")
        if post["faq"]:
            full.append("\n## FAQ\n\n" + "\n\n".join(f"### {q}\n\n{a}" for q, a in post["faq"]))
    for kind, data in LEGAL.items():
        full.append(f"\n---\n\n# {data['title']}\n\nCanonical: {SITE}/legal/{kind}/\n\n{data['md'].strip()}\n")
    write(APP / "llms-full.txt", "\n".join(full) + "\n")

    # security.txt
    security = f"""Contact: mailto:{EMAIL}
Expires: 2027-11-14T00:00:00.000Z
Preferred-Languages: en
Canonical: {SITE}/.well-known/security.txt
Policy: {SITE}/legal/privacy/
"""
    write(APP / ".well-known" / "security.txt", security)

    # OpenAPI
    openapi = {
        "openapi": "3.1.0",
        "info": {
            "title": "The Soft Life System API",
            "version": "1.0.0",
            "description": "Public and admin API for The Soft Life System. Member endpoints use a bearer token from /api/signin. Admin endpoints use a separate super-admin bearer token from /api/admin/login. The purchase webhook uses a separate bearer secret.",
            "contact": {"name": "Gabochie Books", "email": EMAIL, "url": SITE},
            "license": {"name": "Proprietary"},
        },
        "servers": [{"url": SITE, "description": "Production"}],
        "tags": [
            {"name": "Public", "description": "Health, configuration and discovery."},
            {"name": "Auth", "description": "Member signup, signin and sessions."},
            {"name": "Member", "description": "Authenticated member features."},
            {"name": "Audio", "description": "Authenticated audio streaming."},
            {"name": "Admin", "description": "Super-admin operations. Requires an admin bearer token."},
            {"name": "Webhook", "description": "Checkout provider callbacks. Requires the webhook bearer secret."},
        ],
        "paths": {
            "/api/health": {
                "get": {"tags": ["Public"], "summary": "Health check", "responses": {"200": {"description": "Service is up"}}}
            },
            "/api/config": {
                "get": {
                    "tags": ["Public"],
                    "summary": "Public runtime configuration",
                    "responses": {
                        "200": {
                            "description": "Checkout URL, support email, site URL and audio tier data",
                            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Config"}}},
                        }
                    },
                }
            },
            "/api/signup": {
                "post": {
                    "tags": ["Auth"],
                    "summary": "Create a free member account",
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/SignupRequest"}}}},
                    "responses": {
                        "201": {"description": "Account created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AuthResponse"}}}},
                        "400": {"description": "Validation error"},
                    },
                }
            },
            "/api/signin": {
                "post": {
                    "tags": ["Auth"],
                    "summary": "Sign in and receive a member bearer token",
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/SigninRequest"}}}},
                    "responses": {
                        "200": {"description": "Signed in", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AuthResponse"}}}},
                        "401": {"description": "Invalid credentials"},
                    },
                }
            },
            "/api/signout": {
                "post": {
                    "tags": ["Auth"],
                    "summary": "Revoke the current member session",
                    "security": [{"memberAuth": []}],
                    "responses": {"200": {"description": "Signed out"}},
                }
            },
            "/api/me": {
                "get": {
                    "tags": ["Member"],
                    "summary": "Get the current member profile",
                    "security": [{"memberAuth": []}],
                    "responses": {"200": {"description": "Member profile", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/User"}}}}},
                }
            },
            "/api/onboarding": {
                "get": {
                    "tags": ["Member"],
                    "summary": "Get the member's onboarding profile",
                    "security": [{"memberAuth": []}],
                    "responses": {"200": {"description": "Onboarding profile or null", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/OnboardingResponse"}}}}},
                },
                "post": {
                    "tags": ["Member"],
                    "summary": "Create or update onboarding, consent and acquisition data",
                    "security": [{"memberAuth": []}],
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/OnboardingRequest"}}}},
                    "responses": {
                        "200": {"description": "Onboarding saved", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/OnboardingResponse"}}}},
                        "400": {"description": "Validation error, including WhatsApp consent without a valid number"},
                    },
                },
            },
            "/api/events": {
                "post": {
                    "tags": ["Member"],
                    "summary": "Record an allowlisted product event",
                    "security": [{"memberAuth": []}],
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EventRequest"}}}},
                    "responses": {"200": {"description": "Event recorded"}, "400": {"description": "Unknown event"}},
                }
            },
            "/api/tasks": {
                "get": {
                    "tags": ["Member"],
                    "summary": "List the member's 90-day plan tasks",
                    "security": [{"memberAuth": []}],
                    "responses": {"200": {"description": "Task list"}},
                },
                "post": {
                    "tags": ["Member"],
                    "summary": "Add a custom task",
                    "security": [{"memberAuth": []}],
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/NewTask"}}}},
                    "responses": {"201": {"description": "Task created"}},
                },
            },
            "/api/tasks/toggle": {
                "post": {
                    "tags": ["Member"],
                    "summary": "Toggle a task's done state",
                    "security": [{"memberAuth": []}],
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object", "required": ["id"], "properties": {"id": {"type": "integer"}}}}}},
                    "responses": {"200": {"description": "Task updated"}, "404": {"description": "Task not found"}},
                }
            },
            "/api/affiliate": {
                "get": {
                    "tags": ["Member"],
                    "summary": "Get affiliate link stats",
                    "security": [{"memberAuth": []}],
                    "responses": {"200": {"description": "Referral code and commission data"}},
                }
            },
            "/api/audio/{slug}.mp3": {
                "get": {
                    "tags": ["Audio"],
                    "summary": "Stream a chapter audio file",
                    "description": "The free tier can stream intro and ch01. The complete tier can stream ch01–ch15. Supports HTTP Range requests.",
                    "security": [{"memberAuth": []}],
                    "parameters": [
                        {"name": "slug", "in": "path", "required": True, "schema": {"type": "string", "examples": ["intro", "ch01", "ch15"]}},
                        {"name": "t", "in": "query", "required": False, "description": "Optional member token for audio elements that cannot set headers.", "schema": {"type": "string"}},
                        {"name": "Range", "in": "header", "required": False, "schema": {"type": "string"}},
                    ],
                    "responses": {
                        "200": {"description": "Audio stream"},
                        "206": {"description": "Partial audio stream"},
                        "401": {"description": "Unauthorized"},
                        "403": {"description": "Locked for the current tier"},
                        "404": {"description": "Audio not found"},
                    },
                }
            },
            "/api/admin/login": {
                "post": {
                    "tags": ["Admin"],
                    "summary": "Create a super-admin session",
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object", "required": ["password"], "properties": {"password": {"type": "string"}}}}}},
                    "responses": {
                        "200": {"description": "Admin token", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AdminAuthResponse"}}}},
                        "401": {"description": "Wrong admin password"},
                    },
                }
            },
            "/api/admin/logout": {
                "post": {
                    "tags": ["Admin"],
                    "summary": "Revoke the current admin session",
                    "security": [{"adminAuth": []}],
                    "responses": {"200": {"description": "Signed out"}},
                }
            },
            "/api/admin/overview": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "Business overview metrics",
                    "security": [{"adminAuth": []}],
                    "responses": {"200": {"description": "Users, signups, tasks, referrals, purchases, revenue, onboarding, WhatsApp opt-ins, events and audio status"}},
                }
            },
            "/api/admin/users": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "List members",
                    "security": [{"adminAuth": []}],
                    "parameters": [
                        {"name": "q", "in": "query", "schema": {"type": "string"}},
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 50, "maximum": 100}},
                        {"name": "offset", "in": "query", "schema": {"type": "integer", "default": 0}},
                    ],
                    "responses": {"200": {"description": "Member list"}},
                }
            },
            "/api/admin/users/{id}/tier": {
                "post": {
                    "tags": ["Admin"],
                    "summary": "Set a member's tier",
                    "security": [{"adminAuth": []}],
                    "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object", "required": ["tier"], "properties": {"tier": {"type": "string", "enum": ["free", "complete"]}}}}}},
                    "responses": {"200": {"description": "Tier updated"}, "404": {"description": "Member not found"}},
                }
            },
            "/api/admin/users/{id}/role": {
                "post": {
                    "tags": ["Admin"],
                    "summary": "Set a member's role",
                    "security": [{"adminAuth": []}],
                    "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                    "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object", "required": ["role"], "properties": {"role": {"type": "string", "enum": ["member", "admin", "superadmin"]}}}}}},
                    "responses": {"200": {"description": "Role updated"}, "404": {"description": "Member not found"}},
                }
            },
            "/api/admin/referrals": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "List recent referral events",
                    "security": [{"adminAuth": []}],
                    "responses": {"200": {"description": "Referral list"}},
                }
            },
            "/api/admin/purchases": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "List recent purchases",
                    "security": [{"adminAuth": []}],
                    "responses": {"200": {"description": "Purchase list"}},
                }
            },
            "/api/admin/onboarding": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "List onboarding profiles and WhatsApp consent",
                    "security": [{"adminAuth": []}],
                    "responses": {"200": {"description": "Up to 200 onboarding profiles joined to member accounts"}},
                }
            },
            "/api/admin/audio": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "Audio upload status",
                    "security": [{"adminAuth": []}],
                    "responses": {"200": {"description": "Uploaded, missing and expected chapters"}},
                }
            },
            "/api/webhooks/purchase": {
                "post": {
                    "tags": ["Webhook"],
                    "summary": "Record a purchase and upgrade the matching member",
                    "security": [{"webhookAuth": []}],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["email"],
                                    "properties": {
                                        "email": {"type": "string", "format": "email"},
                                        "order_id": {"type": "string"},
                                        "tier": {"type": "string", "enum": ["free", "complete"], "default": "complete"},
                                        "amount": {"type": "number"},
                                        "currency": {"type": "string"},
                                        "provider": {"type": "string", "default": "selar"},
                                    },
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {"description": "Purchase recorded or duplicate ignored"},
                        "401": {"description": "Bad webhook secret"},
                        "503": {"description": "Webhook not configured"},
                    },
                }
            },
        },
        "components": {
            "securitySchemes": {
                "memberAuth": {"type": "http", "scheme": "bearer", "description": "Member token from /api/signin."},
                "adminAuth": {"type": "http", "scheme": "bearer", "description": "Super-admin token from /api/admin/login."},
                "webhookAuth": {"type": "http", "scheme": "bearer", "description": "Purchase webhook secret configured in Cloudflare."},
            },
            "schemas": {
                "Config": {
                    "type": "object",
                    "properties": {
                        "siteUrl": {"type": "string", "format": "uri"},
                        "checkoutUrl": {"type": "string"},
                        "supportEmail": {"type": "string", "format": "email"},
                        "freeAudio": {"type": "array", "items": {"type": "string"}},
                        "allAudio": {"type": "array", "items": {"type": "string"}},
                        "tiers": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "SignupRequest": {
                    "type": "object",
                    "required": ["email", "password"],
                    "properties": {
                        "email": {"type": "string", "format": "email"},
                        "password": {"type": "string", "minLength": 8},
                        "name": {"type": "string"},
                        "ref": {"type": "string"},
                        "acquisition": {"$ref": "#/components/schemas/Acquisition"},
                    },
                },
                "Acquisition": {
                    "type": "object",
                    "properties": {
                        "source": {"type": "string"},
                        "utm_source": {"type": "string"},
                        "utm_medium": {"type": "string"},
                        "utm_campaign": {"type": "string"},
                        "utm_content": {"type": "string"},
                        "utm_term": {"type": "string"},
                        "referrer": {"type": "string"},
                        "landing_path": {"type": "string"},
                    },
                },
                "OnboardingRequest": {
                    "type": "object",
                    "properties": {
                        "business_name": {"type": "string", "maxLength": 120},
                        "business_stage": {"type": "string", "enum": ["", "idea", "early", "growing", "established", "other"]},
                        "country": {"type": "string", "maxLength": 80},
                        "timezone": {"type": "string", "maxLength": 64},
                        "main_goal": {"type": "string", "enum": ["", "simplify", "offer", "systems", "delegate", "time", "freedom", "other"]},
                        "biggest_challenge": {"type": "string", "enum": ["", "time", "overwhelm", "pricing", "clients", "systems", "focus", "other"]},
                        "revenue_range": {"type": "string", "enum": ["", "pre_revenue", "under_1k", "1k_3k", "3k_10k", "10k_plus", "prefer_not"]},
                        "team_size": {"type": "string", "enum": ["", "solo", "contractors", "small_team", "team"]},
                        "whatsapp_number": {"type": "string", "description": "Required only when whatsapp_consent is true. 7-15 digits with country code."},
                        "whatsapp_consent": {"type": "boolean", "default": False},
                        "marketing_consent": {"type": "boolean", "default": False},
                        "acquisition": {"$ref": "#/components/schemas/Acquisition"},
                    },
                },
                "OnboardingResponse": {
                    "type": "object",
                    "properties": {
                        "onboarding": {
                            "type": "object",
                            "nullable": True,
                            "properties": {
                                "business_name": {"type": "string"},
                                "business_stage": {"type": "string"},
                                "country": {"type": "string"},
                                "timezone": {"type": "string"},
                                "main_goal": {"type": "string"},
                                "biggest_challenge": {"type": "string"},
                                "revenue_range": {"type": "string"},
                                "team_size": {"type": "string"},
                                "whatsapp_number": {"type": "string"},
                                "whatsapp_consent": {"type": "integer"},
                                "whatsapp_consent_at": {"type": "string", "nullable": True},
                                "marketing_consent": {"type": "integer"},
                                "marketing_consent_at": {"type": "string", "nullable": True},
                                "consent_version": {"type": "string"},
                                "source": {"type": "string"},
                                "utm_source": {"type": "string"},
                                "utm_medium": {"type": "string"},
                                "utm_campaign": {"type": "string"},
                                "completed_at": {"type": "string", "nullable": True},
                                "updated_at": {"type": "string"},
                            },
                        }
                    },
                },
                "EventRequest": {
                    "type": "object",
                    "required": ["event"],
                    "properties": {
                        "event": {"type": "string", "enum": ["onboarding_skipped", "task_added", "task_completed", "audio_play", "checkout_click"]},
                        "path": {"type": "string"},
                        "meta": {"type": "object", "additionalProperties": True},
                    },
                },
                "SigninRequest": {
                    "type": "object",
                    "required": ["email", "password"],
                    "properties": {"email": {"type": "string", "format": "email"}, "password": {"type": "string"}},
                },
                "AuthResponse": {
                    "type": "object",
                    "properties": {"token": {"type": "string"}, "user": {"$ref": "#/components/schemas/User"}},
                },
                "AdminAuthResponse": {
                    "type": "object",
                    "properties": {"token": {"type": "string"}, "role": {"type": "string", "enum": ["superadmin"]}, "expires_at": {"type": "string", "format": "date-time"}},
                },
                "User": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "email": {"type": "string", "format": "email"},
                        "name": {"type": "string"},
                        "tier": {"type": "string", "enum": ["free", "complete"]},
                        "role": {"type": "string", "enum": ["member", "admin", "superadmin"]},
                        "ref_code": {"type": "string"},
                    },
                },
                "NewTask": {
                    "type": "object",
                    "required": ["title"],
                    "properties": {
                        "title": {"type": "string"},
                        "detail": {"type": "string"},
                        "week": {"type": "integer", "minimum": 1, "maximum": 12},
                    },
                },
            },
        },
    }
    write(APP / "openapi.json", json.dumps(openapi, ensure_ascii=False, indent=2))

    print(f"Built {len(POSTS)} posts, {len(LEGAL)} legal pages, feeds, sitemap, robots, llms.txt, llms-full.txt, openapi.json and security.txt")


if __name__ == "__main__":
    build()
