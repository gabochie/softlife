const SITE_URL = "https://soft.gabochie.com";
const FREE_AUDIO = new Set(["intro", "ch01"]);
const AUDIO_SLUGS = ["intro", ...Array.from({ length: 15 }, (_, i) => "ch" + String(i + 1).padStart(2, "0"))];
const STAFF_ROLES = ["superadmin", "sales", "support", "content"];
const CRM_STAGES = ["lead", "engaged", "checkout_abandoned", "customer", "client", "lost"];
// Which staff roles may use each admin capability. The superadmin password login
// maps to the "superadmin" role; staff logins carry their own role.
const ADMIN_CAPS = {
  overview: new Set(["superadmin", "sales", "support", "content"]),
  users: new Set(["superadmin", "sales", "support"]),
  set_tier: new Set(["superadmin", "sales", "support"]),
  set_role: new Set(["superadmin"]),
  crm: new Set(["superadmin", "sales", "support"]),
  crm_stage: new Set(["superadmin", "sales"]),
  crm_note: new Set(["superadmin", "sales", "support"]),
  analytics: new Set(["superadmin", "sales", "support", "content"]),
  referrals: new Set(["superadmin", "sales"]),
  purchases: new Set(["superadmin", "sales"]),
  onboarding: new Set(["superadmin", "sales", "support"]),
  audio: new Set(["superadmin", "sales", "support", "content"]),
  team: new Set(["superadmin"]),
  webhooks: new Set(["superadmin", "sales"]),
  security: new Set(["superadmin"]),
  email: new Set(["superadmin", "sales"]),
  affiliate_payout: new Set(["superadmin"]),
  careers: new Set(["superadmin", "sales", "support"]),
  geo: new Set(["superadmin", "sales", "support", "content"]),
  goals: new Set(["superadmin", "sales"]),
  blog: new Set(["superadmin", "content"])
};
// Blog registry mirrors tools/build_blog.py POSTS (slug -> title).
const BLOG_POSTS = [
  ["15-hour-workweek-for-women", "The 15-Hour Workweek for Women Who Are Done Doing Everything"],
  ["hustle-hangover-signs", "The Hustle Hangover: 7 Signs You Built a Job, Not a Business"],
  ["design-a-soft-life-week", "How to Design a Soft Life Week (Free 90-Day Plan)"],
  ["one-offer-premium-price", "One Offer, Premium Price: The Simplest Business Model That Pays"],
  ["ai-agents-soft-life-business", "AI Agents Are Coming for Your Busywork. Build a Business With a Brain, Not More Hustle."]
];
const CONSENT_VERSION = "2026-11-14";
// Interactive Soft Life Scorecard. The "ten" text and bands mirror the PDF
// lead magnet so the personalised online report never drifts from it.
const SCORECARD_DIMENSIONS = [
  { key: "time", label: "Time", ten: "You work ≤ 20 hrs/week by design, not by accident.", action: "Audit your week: eliminate one recurring task, template one, delegate one." },
  { key: "money", label: "Money", ten: "Revenue is predictable; you know your number every month.", action: "Set your monthly income number and review it every Monday — predictable revenue starts with a number." },
  { key: "energy", label: "Energy", ten: "You finish the day with something left. No 3pm crash.", action: "Protect one no-work block and one slow morning before you touch your inbox." },
  { key: "joy", label: "Joy", ten: "You'd do your best work even if no one paid you.", action: "Pick the work you'd do unpaid and make it the centre of your offer." },
  { key: "relationships", label: "Relationships", ten: "Family and friends get your best hours, not your leftovers.", action: "Block two protected hours this week for family and friends — best hours, not leftovers." },
  { key: "health", label: "Health", ten: "Sleep, movement and food are not negotiable.", action: "Make sleep, movement and food non-negotiable for seven days." },
  { key: "focus", label: "Focus", ten: "One offer, one audience, one channel. No shiny objects.", action: "Pick one offer, one audience, one channel. Nothing else gets a yes this month." },
  { key: "freedom", label: "Freedom", ten: "You can take a week off without the business breaking.", action: "Document the three tasks only you can do, then hand one to someone else for a week." },
];
const SESSION_DAYS = 30;
const AUDIO_TOKEN_MINUTES = 120;
const ONBOARDING_CHOICES = {
  business_stage: ["idea", "early", "growing", "established", "other"],
  main_goal: ["simplify", "offer", "systems", "delegate", "time", "freedom", "other"],
  biggest_challenge: ["time", "overwhelm", "pricing", "clients", "systems", "focus", "other"],
  revenue_range: ["pre_revenue", "under_1k", "1k_3k", "3k_10k", "10k_plus", "prefer_not"],
  team_size: ["solo", "contractors", "small_team", "team"]
};
const ACQUISITION_KEYS = ["source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"];
const EVENT_NAMES = new Set([
  "signup", "signin", "onboarding_saved", "onboarding_completed", "onboarding_skipped",
  "whatsapp_consent_granted", "whatsapp_consent_withdrawn",
  "task_added", "task_completed", "audio_play", "checkout_click", "ref_visit",
  "password_reset_requested", "password_reset_completed", "password_changed",
  "page_view"
]);
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};
const JSON_HEADERS = {
  ...SECURITY_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const LAUNCH_TASKS = [
  [1, "Complete the Hustle Hangover Checklist", "Chapter 1 — face where your time actually goes."],
  [1, "Complete the Four Audits", "Chapter 3 — Time, Money, Energy, Joy."],
  [1, "Calculate your Soft Life Scorecard", "Chapter 3 — score all eight dimensions. Free tool: /tools/scorecard.html"],
  [1, "Write your one-sentence business", "Chapter 4 — I help [audience] achieve [outcome] through [mechanism]."],
  [1, "Choose one audience, one offer, one outcome", "Chapter 4 — focus beats variety."],
  [2, "Redesign your offer using the Premium Offer Formula", "Chapter 5 — package your genius into premium."],
  [2, "Set your premium price", "Chapter 5 — price the transformation, not the hours."],
  [2, "Map your delivery process", "Chapter 6 — Intake, Onboard, Execute, Handoff, Follow-up."],
  [2, "Create three templates", "Chapter 6 — welcome email, proposal, follow-up."],
  [3, "Build your first automation", "Chapter 7 — scheduling and welcome email."],
  [3, "Document one task and delegate it", "Chapter 7 — the first transfer."],
  [3, "Design your Soft Life Week", "Chapter 8 — the sample 15-hour week, adapted to you."],
  [4, "Set your no-work zones", "Chapter 8 — protect rest like revenue."],
  [4, "Write your Boundary Policy", "Chapter 11 — scripts for scope, availability, requests."],
  [5, "Define your enough", "Chapter 12 — income, clients, hours, rest."],
  [8, "Schedule your monthly Soft Life Review", "Chapter 15 — the maintenance ritual."]
];

export default {
  async scheduled(event, env, ctx) {
    // Daily email engine: welcome drips, upsell, win-back. Runs at 07:00 UTC.
    try {
      const summary = await runEmailSequences(env);
      console.log("softlife email sequences", summary);
    } catch (err) {
      console.error("softlife email sequences failed", err);
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url, ctx);
      } catch (err) {
        console.error("softlife api error", err);
        return json({ error: "Something went wrong." }, 500);
      }
    }

    // Public CMS blog post: /blog/<slug>/ served from D1 when no static asset exists.
    const blogMatch = url.pathname.match(/^\/blog\/([a-z0-9-]+)\/$/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const row = await env.DB.prepare(
        "SELECT slug, title, description, author, category, tags, canonical, body_html, faq_json, og_image, published, created_at, updated_at "
        + "FROM softlife_blog_posts WHERE slug = ? AND published = 1"
      ).bind(slug).first();
      if (row) {
        const html = renderCmsBlogPost(row);
        return new Response(html, {
          status: 200,
          headers: { ...JSON_HEADERS, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" }
        });
      }
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    if (url.pathname.startsWith("/assets/") || /\.(png|jpe?g|webp|svg|ico|mp3|woff2?|ttf)$/i.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=604800");
    } else if (/\.(css|js)$/i.test(url.pathname)) {
      // Code must revalidate on every load: a deploy is visible immediately,
      // while the service worker still serves cached code when offline.
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    } else if (/\.(json|xml|txt)$/i.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=3600");
    } else {
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
};

// ---------- Gamification: badges + streaks ----------
const BADGE_DEFS = [
  { key: "first_step", label: "First Step", desc: "Completed your first task.", icon: "🌱" },
  { key: "week1_done", label: "Week 1 Clear", desc: "Completed all Week 1 tasks.", icon: "✅" },
  { key: "halfway", label: "Halfway There", desc: "Completed 50% of the 90-day plan.", icon: "🏁" },
  { key: "launch_complete", label: "Launch Complete", desc: "Completed every task in the 90-day plan.", icon: "🎉" },
  { key: "custom_creator", label: "Own It", desc: "Added your first custom task.", icon: "✏️" },
  { key: "streak_3", label: "3-Day Streak", desc: "Completed tasks 3 days in a row.", icon: "🔥" },
  { key: "streak_7", label: "Week Warrior", desc: "Completed tasks 7 days in a row.", icon: "⚡" },
];

async function awardBadge(env, userId, key) {
  try {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO softlife_badges (user_id, badge_key) VALUES (?, ?)"
    ).bind(userId, key).run();
  } catch (exc) {
    console.error("badge award failed", exc);
  }
}

async function checkBadges(env, userId) {
  const tasks = await env.DB.prepare(
    "SELECT week, kind, done FROM softlife_tasks WHERE user_id = ?"
  ).bind(userId).all();
  const rows = tasks.results || [];
  const total = rows.length;
  const done = rows.filter((t) => t.done === 1).length;
  const pct = total > 0 ? done / total : 0;
  const week1Tasks = rows.filter((t) => t.week === 1);
  const week1Done = week1Tasks.length > 0 && week1Tasks.every((t) => t.done === 1);
  const hasCustom = rows.some((t) => t.kind === "custom");

  if (done >= 1) await awardBadge(env, userId, "first_step");
  if (week1Done) await awardBadge(env, userId, "week1_done");
  if (pct >= 0.5) await awardBadge(env, userId, "halfway");
  if (total > 0 && done === total) await awardBadge(env, userId, "launch_complete");
  if (hasCustom) await awardBadge(env, userId, "custom_creator");

  // Streaks: consecutive days with at least one task_completed event.
  const ev = await env.DB.prepare(
    "SELECT DISTINCT date(created_at) AS d FROM softlife_events WHERE user_id = ? AND event = 'task_completed' ORDER BY d DESC"
  ).bind(userId).all();
  const dates = (ev.results || []).map((r) => r.d).sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  for (const d of dates) {
    if (d === cursor) {
      streak++;
      const prev = new Date(cursor);
      prev.setDate(prev.getDate() - 1);
      cursor = prev.toISOString().slice(0, 10);
    } else if (d < cursor) {
      break;
    }
  }
  if (streak >= 3) await awardBadge(env, userId, "streak_3");
  if (streak >= 7) await awardBadge(env, userId, "streak_7");

  return { streak };
}

async function handleApi(request, env, url, ctx) {
  const path = url.pathname.replace(/\/+$/, "");

  if (path === "/api/health") {
    return json({ ok: true, service: "softlife", time: new Date().toISOString() });
  }

  if (path === "/api/config" && request.method === "GET") {
    return json({
      siteUrl: env.SITE_URL || SITE_URL,
      checkoutUrl: env.CHECKOUT_URL || "",
      selarUrl: env.SELAR_CHECKOUT_URL || env.CHECKOUT_URL || "",
      payhipUrl: env.PAYHIP_CHECKOUT_URL || "",
      mainstackUrl: env.MAINSTACK_CHECKOUT_URL || "",
      paystackUrl: env.PAYSTACK_CHECKOUT_URL || "",
      country: (request.cf && request.cf.country) || "",
      supportEmail: env.SUPPORT_EMAIL || "admin@gabochie.com",
      freeAudio: [...FREE_AUDIO],
      allAudio: AUDIO_SLUGS,
      tiers: ["free", "complete"]
    });
  }

  if (path === "/api/admin/login" && request.method === "POST") return adminLogin(request, env);
  if (path === "/api/staff/login" && request.method === "POST") return staffLogin(request, env);
  if (path === "/api/admin/logout" && request.method === "POST") return adminLogout(request, env);
  if (path === "/api/webhooks/purchase" && request.method === "POST") return purchaseWebhook(request, env, ctx);

  if (path.startsWith("/api/admin/")) {
    const admin = await currentAdmin(request, env);
    if (!admin) return json({ error: "unauthorized" }, 401);
    if (!roleAllowed(admin.role, path)) return json({ error: "not allowed for your role" }, 403);
    return handleAdmin(request, env, url, path, admin);
  }

  if (path.startsWith("/api/audio/")) {
    return serveAudio(request, env, url, path.slice("/api/audio/".length).replace(/\.mp3$/, ""));
  }

  if (path === "/api/signup" && request.method === "POST") return signup(request, env);
  if (path === "/api/signin" && request.method === "POST") return signin(request, env);
  if (path === "/api/forgot-password" && request.method === "POST") return forgotPassword(request, env);
  if (path === "/api/reset-password" && request.method === "POST") return resetPassword(request, env);
  if (path === "/api/webhooks/mainstack" && request.method === "POST") return mainstackWebhook(request, env, ctx);
  if (path === "/api/webhooks/paystack" && request.method === "POST") return paystackWebhook(request, env, ctx);
  if (path === "/api/signout" && request.method === "POST") return signout(request, env);
  if (path === "/api/claim/preview" && request.method === "POST") return claimPreview(request, env);
  if (path === "/api/claim/complete" && request.method === "POST") return claimComplete(request, env);
  // Public: anonymous referral clicks must count before any account exists.
  if (path === "/api/ref-visit" && request.method === "POST") return refVisit(request, env);
  // Public: one-click marketing opt-out from any campaign footer link.
  if (path === "/api/unsubscribe" && request.method === "GET") return unsubscribe(request, env);
  // Public: interactive lead magnets. Results are saved, then emailed to the
  // prospect as a private printable link (no attachment/deliverability issues).
  if (path === "/api/track" && request.method === "POST") return trackEvent(request, env);
  if (path === "/api/lead/scorecard" && request.method === "POST") return scorecardSubmit(request, env);
  if (path === "/api/lead/audit" && request.method === "POST") return auditSubmit(request, env);
  if (path === "/api/lead/clarity" && request.method === "POST") return claritySubmit(request, env);
  if (path === "/api/lead/result" && request.method === "GET") return leadResult(request, env);
  // Public: remote-team applications from /careers/ (before the auth gate).
  if (path === "/api/careers/apply" && request.method === "POST") return careersApply(request, env);
  // Cron fallback: free plan has no spare cron trigger slots; an external
  // scheduler (cron-job.org) hits this daily with the webhook secret.
  if (path === "/api/email-cron" && request.method === "GET") {
    const cronUrl = new URL(request.url);
    const key = cronUrl.searchParams.get("key") || "";
    if (!env.PURCHASE_WEBHOOK_SECRET || !safeEqual(key, env.PURCHASE_WEBHOOK_SECRET)) {
      return json({ error: "unauthorized" }, 401);
    }
    const summary = await runEmailSequences(env);
    return json({ ok: true, summary });
  }

  const user = await currentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  if (path === "/api/audio-token" && request.method === "POST") return createAudioToken(env, user);
  if (path === "/api/me" && request.method === "GET") return json(publicUser(user));
  if (path === "/api/change-password" && request.method === "POST") return changePassword(request, env, user);

  if (path === "/api/onboarding" && request.method === "GET") {
    return json({ onboarding: await loadOnboarding(env, user.id) });
  }

  if (path === "/api/onboarding" && request.method === "POST") {
    return saveOnboarding(request, env, user);
  }

  if (path === "/api/events" && request.method === "POST") {
    return recordEvent(request, env, user);
  }

  if (path === "/api/tasks" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, title, detail, week, kind, done FROM softlife_tasks WHERE user_id = ? ORDER BY week, id"
    ).bind(user.id).all();
    const { streak } = await checkBadges(env, user.id);
    const badgeRows = await env.DB.prepare(
      "SELECT badge_key, earned_at FROM softlife_badges WHERE user_id = ? ORDER BY earned_at"
    ).bind(user.id).all();
    return json({ tasks: rows.results || [], streak, badges: badgeRows.results || [] });
  }

  if (path === "/api/tasks" && request.method === "POST") {
    const body = await readJson(request);
    const title = String(body.title || "").trim();
    const week = Number(body.week) || 1;
    if (!title) return json({ error: "Task needs a title." }, 400);
    const result = await env.DB.prepare(
      "INSERT INTO softlife_tasks (user_id, title, detail, week, kind) VALUES (?, ?, ?, ?, 'custom')"
    ).bind(user.id, title, String(body.detail || "").trim(), week).run();
    const row = await env.DB.prepare(
      "SELECT id, title, detail, week, kind, done FROM softlife_tasks WHERE id = ?"
    ).bind(result.meta.last_row_id).first();
    await logEvent(env, user.id, "task_added", "/tasks", { task_id: row.id });
    return json({ task: row }, 201);
  }

  if (path === "/api/tasks/toggle" && request.method === "POST") {
    const body = await readJson(request);
    const id = Number(body.id);
    if (!id) return json({ error: "not found" }, 404);
    const row = await env.DB.prepare(
      "UPDATE softlife_tasks SET done = 1 - done WHERE id = ? AND user_id = ? RETURNING id, title, detail, week, kind, done"
    ).bind(id, user.id).first();
    if (!row) return json({ error: "not found" }, 404);
    if (row.done === 1) await logEvent(env, user.id, "task_completed", "/tasks", { task_id: row.id, kind: row.kind });
    const { streak } = await checkBadges(env, user.id);
    const newBadges = await env.DB.prepare(
      "SELECT badge_key FROM softlife_badges WHERE user_id = ? ORDER BY earned_at DESC"
    ).bind(user.id).all();
    return json({ task: row, streak, badges: (newBadges.results || []).map((b) => b.badge_key) });
  }

  if (path === "/api/badges" && request.method === "GET") {
    await checkBadges(env, user.id);
    const rows = await env.DB.prepare(
      "SELECT badge_key, earned_at FROM softlife_badges WHERE user_id = ? ORDER BY earned_at"
    ).bind(user.id).all();
    return json({ badges: rows.results || [], defs: BADGE_DEFS });
  }

  if (path === "/api/streak" && request.method === "GET") {
    const { streak } = await checkBadges(env, user.id);
    const ev = await env.DB.prepare(
      "SELECT DISTINCT date(created_at) AS d FROM softlife_events WHERE user_id = ? AND event = 'task_completed' ORDER BY d DESC"
    ).bind(user.id).all();
    const dates = (ev.results || []).map((r) => r.d);
    let longest = 0, cur = 0, prev = null;
    for (const d of dates.sort()) {
      if (prev && new Date(d) - new Date(prev) === 86400000) cur++;
      else cur = 1;
      if (cur > longest) longest = cur;
      prev = d;
    }
    return json({ current: streak, longest, total_days: dates.length });
  }

  if (path === "/api/affiliate" && request.method === "GET") {
    const code = user.ref_code;
    const [clicks, signups, purchases, pending, paid] = await Promise.all([
      env.DB.prepare(
        "SELECT COUNT(*) AS c FROM softlife_referrals WHERE ref_code = ? AND status = 'clicked'"
      ).bind(code).first(),
      env.DB.prepare(
        "SELECT COUNT(*) AS c FROM softlife_referrals WHERE ref_code = ? AND status IN ('signed_up','purchased')"
      ).bind(code).first(),
      env.DB.prepare(
        "SELECT COUNT(*) AS c FROM softlife_purchases WHERE ref_code = ?"
      ).bind(code).first(),
      env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) AS s FROM softlife_affiliate_earnings WHERE ref_code = ? AND status = 'pending'"
      ).bind(code).first(),
      env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) AS s FROM softlife_affiliate_earnings WHERE ref_code = ? AND status = 'paid'"
      ).bind(code).first()
    ]);
    const lifetime = Number(pending.s) + Number(paid.s);
    return json({
      ref_code: code,
      clicks: clicks ? clicks.c : 0,
      signups: signups ? signups.c : 0,
      purchases: purchases ? purchases.c : 0,
      conversion_rate: clicks && clicks.c > 0 ? Math.round((purchases.c / clicks.c) * 1000) / 10 : 0,
      pending_earnings: Math.round(Number(pending.s) * 100) / 100,
      paid_earnings: Math.round(Number(paid.s) * 100) / 100,
      lifetime_earnings: Math.round(lifetime * 100) / 100,
      commission_rate: "30%",
      payout_note: "Payouts run monthly via Selar mobile money (MVP: manual review)."
    });
  }

  return json({ error: "not found" }, 404);
}


/* ---------- Careers: remote team applications (public, no account) ---------- */
const CAREERS_ROLES = [
  "Platform & Reliability Engineer",
  "Customer Support & Onboarding Specialist",
  "Content & SEO Marketer",
  "QA & Release Tester",
  "Finance & Operations Analyst",
  "Community & Research Lead",
  "Talent pool / general"
];

async function careersApply(request, env) {
  const body = await readJson(request);
  if (cleanText(body.website, 60)) return json({ ok: true }); // honeypot
  const email = cleanText(body.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (body.consent !== true && body.consent !== 1 && body.consent !== "1") {
    return json({ error: "Please tick the consent box so we can reply to you." }, 400);
  }
  const name = cleanText(body.name, 80);
  const role = cleanChoice(body.role, CAREERS_ROLES);
  const message = cleanText(body.message, 2000);
  if (!name) return json({ error: "Enter your name." }, 400);
  if (!role) return json({ error: "Choose a role." }, 400);
  if (message.length < 20) return json({ error: "Tell us a little more about yourself (20 characters minimum)." }, 400);
  const portfolio = cleanText(body.portfolio, 200);
  const availability = cleanText(body.availability, 60);
  const ip = clientIp(request);

  try {
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM softlife_job_applications WHERE email = ? "
      + "AND created_at >= datetime('now', '-1 hour')"
    ).bind(email).first();
    if (recent && recent.c >= 3) {
      return json({ error: "We've already received your application. We'll be in touch." }, 429);
    }
    await env.DB.prepare(
      "INSERT INTO softlife_job_applications (name, email, role, portfolio, availability, message, ip, consent) "
      + "VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
    ).bind(name, email, role, portfolio, availability, message, ip).run();
  } catch (e) {
    return json({ error: "We couldn't save that just now. Please email admin@gabochie.com instead." }, 500);
  }

  // Best-effort notification to the founder; never fail the applicant over email.
  try {
    const safe = (v) => String(v || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    await sendPurchaseEmail(
      env,
      env.SUPPORT_EMAIL || "admin@gabochie.com",
      `New application: ${role} — ${name}`,
      `<h2>New remote-team application</h2><p><b>Role:</b> ${safe(role)}</p><p><b>Name:</b> ${safe(name)}<br><b>Email:</b> ${safe(email)}</p><p><b>Availability:</b> ${safe(availability)}</p><p><b>Portfolio:</b> ${safe(portfolio)}</p><p><b>Note:</b></p><p>${safe(message).replace(/\n/g, "<br>")}</p>`,
      `Role: ${role}\nName: ${name}\nEmail: ${email}\nAvailability: ${availability}\nPortfolio: ${portfolio}\n\n${message}`,
      "job_application"
    );
  } catch (e) { /* logged by sendPurchaseEmail */ }

  return json({ ok: true });
}

async function signup(request, env) {
  const body = await readJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const ref = String(body.ref || "").trim().toUpperCase();

  if (!email || !email.includes("@") || password.length < 8) {
    return json({ error: "Valid email and 8+ character password required." }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM softlife_users WHERE email = ?"
  ).bind(email).first();
  if (existing) {
    return json({ error: "That email is already registered. Sign in instead." }, 409);
  }

  const salt = randomHex(8);
  const passwordHash = await hashPassword(password, salt);
  const refCode = "SL" + randomHex(3).toUpperCase();
  const consent = body.marketing_consent === 0 ? 0 : 1;
  const unsubToken = randomHex(16);
  const purchase = await env.DB.prepare(
    "SELECT tier FROM softlife_purchases WHERE email = ? ORDER BY id DESC LIMIT 1"
  ).bind(email).first();
  const tier = purchase && purchase.tier ? purchase.tier : "free";
  const inserted = await env.DB.prepare(
    "INSERT INTO softlife_users (email, name, password_hash, salt, tier, ref_code, referred_by, marketing_consent, unsub_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(email, name || email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()), passwordHash, salt, tier, refCode, ref || null, consent, unsubToken).run();

  const userId = inserted.meta.last_row_id;
  // Buyer signed up after paying: close any pending access claim for this email.
  await env.DB.prepare(
    "UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE email = ? AND completed_at IS NULL"
  ).bind(email).run();
  const acquisition = cleanAcquisition(body.acquisition, ref ? "referral" : "direct");
  await saveOnboardingRow(env, userId, {}, acquisition);
  await logEvent(env, userId, "signup", "/signup", { ref: ref || null, source: acquisition.source });
  if (ref) {
    await env.DB.prepare(
      "INSERT INTO softlife_referrals (ref_code, email, status) VALUES (?, ?, 'signed_up')"
    ).bind(ref, email).run();
  }

  if (LAUNCH_TASKS.length) {
    await env.DB.batch(
      LAUNCH_TASKS.map(([week, title, detail]) =>
        env.DB.prepare(
          "INSERT INTO softlife_tasks (user_id, title, detail, week, kind) VALUES (?, ?, ?, ?, 'launch')"
        ).bind(userId, title, detail, week)
      )
    );
  }

  const user = await env.DB.prepare("SELECT * FROM softlife_users WHERE id = ?").bind(userId).first();
  const token = await createSession(env, userId);
  return json({ token, user: publicUser(user) }, 201);
}

async function signin(request, env) {
  const body = await readJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = await env.DB.prepare(
    "SELECT * FROM softlife_users WHERE email = ?"
  ).bind(email).first();
  if (!user) {
    const bought = await env.DB.prepare(
      "SELECT id FROM softlife_purchases WHERE email = ? LIMIT 1"
    ).bind(email).first();
    if (bought) {
      await logSecurity(env, "member_login_failed", email, clientIp(request), "purchased but no account yet");
      return json({
        error: "We found your purchase, but this email has no login yet. Use the access link from your receipt, or create your account on the sign-up page — your purchase unlocks automatically."
      }, 401);
    }
    await logSecurity(env, "member_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) {
    await logSecurity(env, "member_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const token = await createSession(env, user.id);
  await logEvent(env, user.id, "signin", "/signin", {});
  return json({ token, user: publicUser(user) });
}

async function forgotPassword(request, env) {
  const body = await readJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "A valid email is required." }, 400);
  // Anti-enumeration: the response is identical whether or not the account exists.
  const user = await env.DB.prepare(
    "SELECT id, name FROM softlife_users WHERE lower(email) = ?"
  ).bind(email).first();
  if (!user) {
    await new Promise((r) => setTimeout(r, 300));
    return json({ ok: true });
  }
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare("DELETE FROM softlife_password_resets WHERE expires_at <= datetime('now')").run();
  await env.DB.prepare(
    "INSERT INTO softlife_password_resets (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+60 minutes'))"
  ).bind(tokenHash, user.id).run();
  const origin = new URL(request.url).origin;
  const link = `${origin}/#/reset?token=${token}`;
  try {
    await sendPurchaseEmail(env, email, "Reset your Soft Life System password",
                            resetEmailHtml(link), resetEmailText(link), "password_reset");
  } catch (exc) {
    console.error("password reset email failed:", exc);
  }
  await logEvent(env, user.id, "password_reset_requested", "/forgot", {});
  return json({ ok: true });
}

async function resetPassword(request, env) {
  const body = await readJson(request);
  const token = String(body.token || "").trim();
  const password = String(body.password || "");
  if (password.length < 8) return json({ error: "Password needs at least 8 characters." }, 400);
  if (!token) return json({ error: "This reset link is invalid or expired." }, 400);
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    "SELECT user_id FROM softlife_password_resets WHERE token_hash = ? AND expires_at > datetime('now')"
  ).bind(tokenHash).first();
  if (!row) return json({ error: "This reset link is invalid or expired." }, 400);
  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  await env.DB.prepare(
    "UPDATE softlife_users SET password_hash = ?, salt = ? WHERE id = ?"
  ).bind(passwordHash, salt, row.user_id).run();
  await env.DB.prepare("DELETE FROM softlife_password_resets WHERE user_id = ?").bind(row.user_id).run();
  await logEvent(env, row.user_id, "password_reset_completed", "/reset", {});
  return json({ ok: true });
}

async function hmacHex(secret, message, hash) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function mainstackAt(obj, path) {
  return path.split(".").reduce((v, k) => (v == null || v[k] === undefined ? undefined : v[k]), obj);
}

function mainstackNormalize(body) {
  const d = body.data || body.payload || {};
  const first = (...vals) => {
    for (const v of vals) {
      const s = v == null ? "" : String(v);
      if (s.trim()) return s.trim();
    }
    return "";
  };
  const email = first(purchaseBodyEmail(body), purchaseBodyEmail(d)).toLowerCase();
  const orderId = first(
    mainstackAt(body, "reference"), mainstackAt(body, "transaction_id"), mainstackAt(body, "order_id"),
    mainstackAt(body, "tx_ref"), mainstackAt(d, "reference"), mainstackAt(d, "order_id"),
    mainstackAt(body, "id")
  ) || null;
  const subunits = Number(mainstackAt(body, "amount_subunits") ?? mainstackAt(body, "amount_in_kobo")
    ?? mainstackAt(d, "amount_subunits"));
  const amount = Number.isFinite(subunits) && subunits
    ? subunits / 100
    : Number(first(mainstackAt(body, "amount"), mainstackAt(body, "total"), mainstackAt(d, "amount")) || 0);
  const currency = first(mainstackAt(body, "currency"), mainstackAt(d, "currency")).toUpperCase() || null;
  const product = first(
    mainstackAt(body, "product.name"), mainstackAt(body, "product_name"),
    mainstackAt(d, "product.name"), mainstackAt(body, "item_name"),
    Array.isArray(body.items) && body.items[0] ? body.items[0].name : ""
  );
  return { email, orderId, amount, currency, product };
}

async function mainstackWebhook(request, env, ctx) {
  const url = new URL(request.url);
  const raw = await request.text();
  let body = {};
  try { body = JSON.parse(raw); } catch (exc) { /* non-JSON body -> invalid email downstream */ }
  const secret = env.MAINSTACK_WEBHOOK_SECRET || "";
  const provided = bearerToken(request) || request.headers.get("X-Webhook-Secret")
    || url.searchParams.get("secret") || url.searchParams.get("key") || "";
  const reject = async () => {
    await logWebhook(env, "rejected", body, null, String((body && purchaseBodyEmail(body)) || ""));
    await logSecurity(env, "webhook_rejected", "", clientIp(request), "source=mainstack");
    return json({ error: "unauthorized" }, 401);
  };
  // Mainstack publishes no payload spec and no fixed signature header name, so
  // accept any of the schemes Nigerian processors use: verif-hash equality
  // (Flutterwave-style) or an HMAC-SHA512/SHA256 body signature.
  let ok = false;
  if (secret) {
    const verifHash = request.headers.get("verif-hash") || "";
    if (verifHash && safeEqual(verifHash, secret)) ok = true;
    if (!ok) {
      for (const header of ["x-mainstack-signature", "x-mainstack-signature-512", "x-mainstack-signature-256"]) {
        const given = request.headers.get(header);
        if (!given) continue;
        const algo = header.endsWith("256") ? "SHA-256" : "SHA-512";
        const expected = await hmacHex(secret, raw, algo);
        if (safeEqual(String(given).toLowerCase(), expected)) { ok = true; break; }
      }
    }
  } else {
    // No Mainstack secret configured yet: fall back to the shared webhook secret.
    const generic = env.PURCHASE_WEBHOOK_SECRET || "";
    ok = Boolean(generic && provided && safeEqual(provided, generic));
  }
  if (!ok) return reject();

  const { email, orderId, amount, currency, product } = mainstackNormalize(body);
  const event = String(body.event || body.type || "");
  if (event && /refund/i.test(event)) {
    await logWebhook(env, "ignored", body, orderId, email, "refund event - not a sale");
    return json({ ok: true, received: true, ignored: true });
  }
  // Same product filter as the Selar/Zapier path: never mint Soft Life access
  // for a buyer of the other product.
  if (product && !/soft\s*life/i.test(product)) {
    await logWebhook(env, "ignored", body, orderId, email, `other product: ${product.slice(0, 80)}`);
    return json({ ok: true, received: true, ignored: true });
  }
  const purchase = { email, order_id: orderId, amount, currency, provider: "mainstack", product: product || undefined };
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(Promise.resolve().then(() => applyPurchase(env, purchase, url.origin))
      .then((r) => console.error("mainstack purchase:", r.status, orderId || email))
      .catch((err) => console.error("mainstack apply failed:", err)));
    return json({ ok: true, received: true });
  }
  const result = await applyPurchase(env, purchase, url.origin);
  if (result.status === "failed") return json({ error: "webhook processing failed" }, 500);
  return json(result.response, result.status === "invalid" ? 400 : 200);
}

// Paystack signs its webhook POSTs with HMAC-SHA512 of the raw body using the
// account secret key, in the x-paystack-signature header.
async function paystackWebhook(request, env, ctx) {
  const raw = await request.text();
  let body = {};
  try { body = JSON.parse(raw); } catch (exc) { /* non-JSON -> rejected below */ }
  const url = new URL(request.url);
  const reject = async () => {
    await logWebhook(env, "rejected", body, null, String((body.data && body.data.customer && body.data.customer.email) || ""));
    await logSecurity(env, "webhook_rejected", "", clientIp(request), "source=paystack");
    return json({ error: "unauthorized" }, 401);
  };
  const secret = env.PAYSTACK_SECRET_KEY || "";
  const given = String(request.headers.get("x-paystack-signature") || "").toLowerCase();
  if (!secret || !given) return reject();
  if (!safeEqual(given, await hmacHex(secret, raw, "SHA-512"))) return reject();

  const event = String(body.event || "");
  const d = body.data || {};
  const email = String((d.customer && d.customer.email) || d.email || "").toLowerCase();
  const orderId = String(d.reference || "").slice(0, 120) || null;
  if (event && /refund/i.test(event)) {
    await logWebhook(env, "ignored", body, orderId, email, "refund event - not a sale");
    return json({ ok: true, received: true, ignored: true });
  }
  if (event && !/^charge\.success$/i.test(event)) {
    await logWebhook(env, "ignored", body, orderId, email, `unhandled event: ${event.slice(0, 60)}`);
    return json({ ok: true, received: true, ignored: true });
  }
  // Product filter: payment pages and metadata may carry a product name; only
  // Soft Life purchases mint access (protects other Paystack projects).
  const product = String(
    (d.metadata && (d.metadata.product_name || d.metadata.product)) ||
    d.product_name || (Array.isArray(d.custom_fields) && d.custom_fields.map((f) => f.value).find((v) => v)) || ""
  );
  if (product && !/soft\s*life/i.test(product)) {
    await logWebhook(env, "ignored", body, orderId, email, `other product: ${product.slice(0, 80)}`);
    return json({ ok: true, received: true, ignored: true });
  }
  const subunits = Number(d.amount);
  const amount = Number.isFinite(subunits) && subunits ? subunits / 100 : 0;
  const purchase = {
    email, order_id: orderId, amount,
    currency: String(d.currency || "").toUpperCase() || null,
    provider: "paystack", product: product || undefined
  };
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(Promise.resolve().then(() => applyPurchase(env, purchase, url.origin))
      .then((r) => console.error("paystack purchase:", r.status, orderId || email))
      .catch((err) => console.error("paystack apply failed:", err)));
    return json({ ok: true, received: true });
  }
  const result = await applyPurchase(env, purchase, url.origin);
  if (result.status === "failed") return json({ error: "webhook processing failed" }, 500);
  return json(result.response, result.status === "invalid" ? 400 : 200);
}

async function changePassword(request, env, user) {
  const body = await readJson(request);
  const current = String(body.current_password || "");
  const next = String(body.new_password || "");
  if (next.length < 8) return json({ error: "New password needs at least 8 characters." }, 400);
  if ((await hashPassword(current, user.salt)) !== user.password_hash) {
    await logSecurity(env, "password_change_failed", user.email, clientIp(request));
    return json({ error: "Your current password is wrong." }, 401);
  }
  const salt = randomHex(8);
  const passwordHash = await hashPassword(next, salt);
  await env.DB.prepare(
    "UPDATE softlife_users SET password_hash = ?, salt = ? WHERE id = ?"
  ).bind(passwordHash, salt, user.id).run();
  await logEvent(env, user.id, "password_changed", "/account", {});
  return json({ ok: true });
}

async function validClaim(env, token) {
  if (!token) return null;
  // Beta invitations are deliberately short-lived (14 days) to create real
  // urgency; paid purchasers keep the 30-day window.
  return env.DB.prepare(
    "SELECT * FROM softlife_purchase_claims WHERE token = ? AND completed_at IS NULL "
    + "AND created_at >= datetime('now', CASE WHEN COALESCE(order_id, '') LIKE 'BETA-%' "
    + "THEN '-14 days' ELSE '-30 days' END)"
  ).bind(token).first();
}

async function claimPreview(request, env) {
  const body = await readJson(request);
  const token = String(body.token || "");
  if (token) {
    const claim = await validClaim(env, token);
    if (!claim) return json({ error: "This access link is invalid, already used, or expired." }, 404);
    const purchase = await env.DB.prepare(
      "SELECT tier, amount, currency FROM softlife_purchases WHERE lower(email) = ? AND order_id = ? LIMIT 1"
    ).bind(claim.email.toLowerCase(), claim.order_id).first();
    return json({
      email: claim.email,
      tier: claim.tier,
      order_id: claim.order_id,
      amount: purchase ? (purchase.amount ?? 19.99) : 19.99,
      currency: purchase ? (purchase.currency || "USD") : "USD"
    });
  }
  // Manual verify: buyer enters the email they paid with and their order ID
  // (shown on the Selar/Paystack receipt). Both must match a recorded purchase.
  const email = String(body.email || "").trim().toLowerCase();
  const orderId = String(body.order_id || "").trim();
  if (!email.includes("@") || !orderId) {
    return json({ error: "Enter the email you paid with and your order ID from the receipt." }, 400);
  }
  const claimed = await env.DB.prepare(
    "SELECT id FROM softlife_purchase_claims WHERE lower(email) = ? AND order_id = ? AND completed_at IS NOT NULL LIMIT 1"
  ).bind(email, orderId).first();
  if (claimed) return json({ error: "This purchase is already unlocked. Please sign in instead." }, 400);
  const purchase = await env.DB.prepare(
    "SELECT tier, amount, currency FROM softlife_purchases WHERE lower(email) = ? AND order_id = ? LIMIT 1"
  ).bind(email, orderId).first();
  if (!purchase) {
    await logSecurity(env, "claim_manual_miss", email, clientIp(request), `order_id=${orderId}`);
    return json({ error: "We haven't received your payment confirmation yet. Give it a few minutes and try again — if it still fails, email admin@gabochie.com with your receipt." }, 404);
  }
  // Reuse a pending claim for this purchase if one exists; otherwise mint one.
  let claim = await env.DB.prepare(
    "SELECT token FROM softlife_purchase_claims WHERE lower(email) = ? AND order_id = ? AND completed_at IS NULL "
    + "AND created_at >= datetime('now', '-30 days') LIMIT 1"
  ).bind(email, orderId).first();
  if (!claim) {
    const newToken = randomHex(16);
    await env.DB.prepare(
      "INSERT INTO softlife_purchase_claims (email, token, order_id, tier) VALUES (?, ?, ?, ?)"
    ).bind(email, newToken, orderId, purchase.tier).run();
    claim = { token: newToken };
  }
  await logSecurity(env, "claim_manual_verified", email, clientIp(request), `order_id=${orderId}`);
  return json({
    email,
    tier: purchase.tier,
    token: claim.token,
    order_id: orderId,
    amount: purchase.amount ?? 19.99,
    currency: purchase.currency || "USD"
  });
}

async function claimComplete(request, env) {
  const body = await readJson(request);
  const token = String(body.token || "");
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  if (password.length < 8) return json({ error: "Password needs at least 8 characters." }, 400);
  const claim = await validClaim(env, token);
  if (!claim) return json({ error: "This access link is invalid, already used, or expired." }, 404);
  const existing = await env.DB.prepare(
    "SELECT * FROM softlife_users WHERE email = ?"
  ).bind(claim.email).first();
  if (existing) {
    await env.DB.batch([
      env.DB.prepare("UPDATE softlife_users SET tier = ? WHERE id = ?").bind(claim.tier, existing.id),
      env.DB.prepare("UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE id = ?").bind(claim.id),
    ]);
    return json({ ok: true, upgraded_existing: true });
  }
  const salt = randomHex(8);
  const passwordHash = await hashPassword(password, salt);
  const inserted = await env.DB.prepare(
    "INSERT INTO softlife_users (email, name, password_hash, salt, tier, ref_code) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    claim.email,
    name || claim.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
    passwordHash,
    salt,
    claim.tier,
    "SL" + randomHex(3).toUpperCase()
  ).run();
  const userId = inserted.meta.last_row_id;
  await saveOnboardingRow(env, userId, {}, cleanAcquisition(null, "purchase"));
  await logEvent(env, userId, "signup", "/claim", { source: "purchase" });
  if (LAUNCH_TASKS.length) {
    await env.DB.batch(
      LAUNCH_TASKS.map(([week, title, detail]) =>
        env.DB.prepare(
          "INSERT INTO softlife_tasks (user_id, title, detail, week, kind) VALUES (?, ?, ?, ?, 'launch')"
        ).bind(userId, title, detail, week)
      )
    );
  }
  await env.DB.prepare(
    "UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE id = ?"
  ).bind(claim.id).run();
  const user = await env.DB.prepare("SELECT * FROM softlife_users WHERE id = ?").bind(userId).first();
  const sessionToken = await createSession(env, userId);
  return json({ token: sessionToken, user: publicUser(user) }, 201);
}

async function signout(request, env) {
  const token = bearerToken(request);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM softlife_sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return json({ ok: true });
}

async function currentUser(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare(
    "SELECT u.* FROM softlife_sessions s JOIN softlife_users u ON u.id = s.user_id "
    + "WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).bind(tokenHash).first();
}

async function currentAudioUser(env, url) {
  const token = url.searchParams.get("token") || "";
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare(
    "SELECT u.* FROM softlife_audio_tokens s JOIN softlife_users u ON u.id = s.user_id "
    + "WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).bind(tokenHash).first();
}

async function createSession(env, userId) {
  const token = randomHex(24);
  const tokenHash = await sha256Hex(token);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM softlife_sessions WHERE expires_at <= datetime('now')"),
    env.DB.prepare(
      "INSERT INTO softlife_sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"
    ).bind(tokenHash, userId, "+" + SESSION_DAYS + " days")
  ]);
  return token;
}

async function createAudioToken(env, user) {
  const token = randomHex(24);
  const tokenHash = await sha256Hex(token);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM softlife_audio_tokens WHERE expires_at <= datetime('now')"),
    env.DB.prepare(
      "INSERT INTO softlife_audio_tokens (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"
    ).bind(tokenHash, user.id, "+" + AUDIO_TOKEN_MINUTES + " minutes")
  ]);
  return json({
    token,
    expires_in: AUDIO_TOKEN_MINUTES * 60,
    expires_at: new Date(Date.now() + AUDIO_TOKEN_MINUTES * 60000).toISOString()
  });
}

function cleanText(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanChoice(value, allowed) {
  const choice = String(value ?? "").trim();
  return allowed.includes(choice) ? choice : "";
}

function cleanAcquisition(value, fallbackSource = "direct") {
  const source = value && typeof value === "object" ? value : {};
  const out = {};
  for (const key of ACQUISITION_KEYS) {
    out[key] = cleanText(source[key], key === "referrer" ? 300 : 120);
  }
  if (!out.source) out.source = fallbackSource;
  return out;
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? "+" + digits : "";
}

function toBool(value) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

async function loadOnboarding(env, userId) {
  return env.DB.prepare("SELECT * FROM softlife_onboarding WHERE user_id = ?").bind(userId).first();
}

async function saveOnboardingRow(env, userId, body, acquisition = null) {
  const existing = await loadOnboarding(env, userId);
  const now = new Date().toISOString();
  const row = {
    business_name: "", business_stage: "", country: "", timezone: "",
    main_goal: "", biggest_challenge: "", revenue_range: "", team_size: "",
    whatsapp_number: "", whatsapp_consent: 0, whatsapp_consent_at: null,
    marketing_consent: 0, marketing_consent_at: null, consent_version: "",
    source: "", utm_source: "", utm_medium: "", utm_campaign: "",
    utm_content: "", utm_term: "", referrer: "", completed_at: null,
    ...(existing || {})
  };
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const textFields = { business_name: 120, country: 80, timezone: 64 };
  for (const [key, max] of Object.entries(textFields)) {
    if (has(key)) row[key] = cleanText(body[key], max);
  }
  for (const [key, allowed] of Object.entries(ONBOARDING_CHOICES)) {
    if (has(key)) row[key] = cleanChoice(body[key], allowed);
  }
  if (has("whatsapp_consent")) {
    const next = toBool(body.whatsapp_consent) ? 1 : 0;
    if (next !== Number(row.whatsapp_consent || 0)) row.whatsapp_consent_at = now;
    row.whatsapp_consent = next;
    if (!next) row.whatsapp_number = "";
  }
  if (has("whatsapp_number")) {
    row.whatsapp_number = normalizePhone(body.whatsapp_number);
  }
  if (has("marketing_consent")) {
    const next = toBool(body.marketing_consent) ? 1 : 0;
    if (next !== Number(row.marketing_consent || 0)) row.marketing_consent_at = now;
    row.marketing_consent = next;
  }
  if (has("whatsapp_consent") || has("marketing_consent")) row.consent_version = CONSENT_VERSION;

  if (acquisition) {
    for (const key of ACQUISITION_KEYS) {
      if (!row[key] && acquisition[key]) row[key] = acquisition[key];
    }
  }
  if (!row.source) row.source = "direct";
  if (row.business_stage && row.main_goal && row.biggest_challenge && !row.completed_at) {
    row.completed_at = now;
  }

  await env.DB.prepare(
    `INSERT INTO softlife_onboarding (
      user_id, business_name, business_stage, country, timezone, main_goal,
      biggest_challenge, revenue_range, team_size, whatsapp_number,
      whatsapp_consent, whatsapp_consent_at, marketing_consent, marketing_consent_at,
      consent_version, source, utm_source, utm_medium, utm_campaign, utm_content,
      utm_term, referrer, completed_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      business_name = excluded.business_name,
      business_stage = excluded.business_stage,
      country = excluded.country,
      timezone = excluded.timezone,
      main_goal = excluded.main_goal,
      biggest_challenge = excluded.biggest_challenge,
      revenue_range = excluded.revenue_range,
      team_size = excluded.team_size,
      whatsapp_number = excluded.whatsapp_number,
      whatsapp_consent = excluded.whatsapp_consent,
      whatsapp_consent_at = excluded.whatsapp_consent_at,
      marketing_consent = excluded.marketing_consent,
      marketing_consent_at = excluded.marketing_consent_at,
      consent_version = excluded.consent_version,
      source = excluded.source,
      utm_source = excluded.utm_source,
      utm_medium = excluded.utm_medium,
      utm_campaign = excluded.utm_campaign,
      utm_content = excluded.utm_content,
      utm_term = excluded.utm_term,
      referrer = excluded.referrer,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at`
  ).bind(
    userId, row.business_name, row.business_stage, row.country, row.timezone, row.main_goal,
    row.biggest_challenge, row.revenue_range, row.team_size, row.whatsapp_number,
    row.whatsapp_consent, row.whatsapp_consent_at, row.marketing_consent, row.marketing_consent_at,
    row.consent_version, row.source, row.utm_source, row.utm_medium, row.utm_campaign, row.utm_content,
    row.utm_term, row.referrer, row.completed_at, now
  ).run();
  return loadOnboarding(env, userId);
}

async function saveOnboarding(request, env, user) {
  const body = await readJson(request);
  const existing = await loadOnboarding(env, user.id);
  const hasConsent = Object.prototype.hasOwnProperty.call(body, "whatsapp_consent");
  const nextConsent = hasConsent ? toBool(body.whatsapp_consent) : Boolean(existing && existing.whatsapp_consent);
  const nextPhone = normalizePhone(
    Object.prototype.hasOwnProperty.call(body, "whatsapp_number")
      ? body.whatsapp_number
      : existing && existing.whatsapp_number
  );
  if (nextConsent && !nextPhone) {
    return json({ error: "Add a valid WhatsApp number with country code, or uncheck the community box." }, 400);
  }
  if (hasConsent) body.whatsapp_number = nextConsent ? nextPhone : "";

  const acquisition = cleanAcquisition(body.acquisition, existing && existing.source ? existing.source : "direct");
  const before = existing || {};
  const row = await saveOnboardingRow(env, user.id, body, acquisition);
  if (!before.completed_at && row.completed_at) {
    await logEvent(env, user.id, "onboarding_completed", "/onboarding", {});
  } else {
    await logEvent(env, user.id, "onboarding_saved", "/onboarding", {});
  }
  if (Number(before.whatsapp_consent || 0) !== Number(row.whatsapp_consent || 0)) {
    await logEvent(
      env, user.id,
      row.whatsapp_consent ? "whatsapp_consent_granted" : "whatsapp_consent_withdrawn",
      "/onboarding", { consent_version: CONSENT_VERSION }
    );
  }
  return json({ onboarding: row });
}

// One-click marketing opt-out: linked from every campaign footer.
async function unsubscribe(request, env) {
  const url = new URL(request.url);
  const token = cleanText(url.searchParams.get("token") || "", 64);
  const page = (title, msg) => new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + title + '</title><style>body{font-family:Georgia,serif;background:#faf7f2;color:#2a0f4a;display:grid;place-items:center;min-height:100vh}div{text-align:center;max-width:420px;padding:24px}h1{color:#5d2189;font-size:1.5rem}p{color:#6d5f7a;line-height:1.6}</style></head>'
    + '<body><div><h1>' + title + '</h1><p>' + msg + '</p></div></body></html>',
    { status: token ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
  if (!token) {
    return page("Invalid link", "This unsubscribe link is missing its token. If you want to stop marketing emails, reply to any email and we'll opt you out.");
  }
  const row = await env.DB.prepare(
    "SELECT id FROM softlife_users WHERE unsub_token = ?"
  ).bind(token).first();
  if (!row) {
    // Lead-magnet results have their own consent record, not a user account.
    const lead = await env.DB.prepare(
      "SELECT id FROM softlife_lead_submissions WHERE unsub_token = ?"
    ).bind(token).first();
    if (!lead) {
      return page("Invalid link", "We couldn't match this unsubscribe link to an account. If you keep receiving emails, reply to any of them and we'll opt you out.");
    }
    await env.DB.prepare(
      "UPDATE softlife_lead_submissions SET consent = 0 WHERE id = ?"
    ).bind(lead.id).run();
    return page("You're unsubscribed", "You won't receive any more marketing emails from The Soft Life System. Your downloaded result and any account access are untouched.");
  }
  await env.DB.prepare(
    "UPDATE softlife_users SET marketing_consent = 0 WHERE id = ?"
  ).bind(row.id).run();
  return page("You're unsubscribed", "You won't receive any more marketing emails from The Soft Life System. Your account and any purchased access are untouched — you'll still get essential emails like password resets and purchase confirmations.");
}

// Anonymous referral click: count one per ref code per day so stats stay honest.
async function refVisit(request, env) {  const body = await readJson(request);
  const ref = cleanText(body.ref, 24).toUpperCase();
  if (!ref) return json({ error: "ref required" }, 400);
  const seen = await env.DB.prepare(
    "SELECT id FROM softlife_referrals WHERE ref_code = ? AND status = 'clicked' AND created_at >= datetime('now', '-1 day') LIMIT 1"
  ).bind(ref).first();
  if (!seen) {
    await env.DB.prepare(
      "INSERT INTO softlife_referrals (ref_code, email, status) VALUES (?, ?, 'clicked')"
    ).bind(ref, null).run();
  }
  return json({ ok: true });
}

async function recordEvent(request, env, user) {
  const body = await readJson(request);
  const event = String(body.event || "").trim();
  if (!EVENT_NAMES.has(event)) return json({ error: "unknown event" }, 400);
  const path = cleanText(body.path, 200);
  const meta = body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? body.meta : {};
  const country = (request.cf && request.cf.country) || null;
  await logEvent(env, user.id, event, path, meta, country);
  return json({ ok: true });
}

async function logEvent(env, userId, event, path, meta, country) {
  if (!EVENT_NAMES.has(event)) return;
  let payload = JSON.stringify(meta || {});
  if (payload.length > 2000) payload = JSON.stringify({ truncated: true });
  const c = country && /^[A-Z]{2}$/.test(country) ? country : null;
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_events (user_id, event, path, meta, country) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId || null, event, cleanText(path, 200), payload, c).run();
  } catch (err) {
    console.warn("softlife event log failed", event, err);
  }
}

// Public, anonymous page_view beacon. Records country only (no IP storage).
// Light rate limiting: one identical event per path per minute per country.
async function trackEvent(request, env) {
  const body = await readJson(request);
  const event = String(body.event || "").trim();
  if (!EVENT_NAMES.has(event)) return json({ error: "unknown event" }, 400);
  const path = cleanText(body.path || "/", 200);
  const country = (request.cf && request.cf.country) || null;
  const window = new URL(request.url).searchParams.get("t") || "";
  try {
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM softlife_events WHERE country = ? AND event = ? AND path = ? "
      + "AND created_at >= datetime('now', '-60 seconds')"
    ).bind(country, event, path).first();
    if (recent && recent.c > 200) return json({ ok: true }); // bot shield per country/path
    await logEvent(env, null, event, path, {}, country);
  } catch (err) {
    console.warn("softlife track failed", event, err);
  }
  return json({ ok: true });
}

async function serveAudio(request, env, url, slug) {
  // Sec-Fetch-Site is browser-enforced: our <audio> elements send same-origin;
  // direct navigation, curl, scripts and "Save As" do not.
  if (request.headers.get("Sec-Fetch-Site") !== "same-origin") {
    return json({ error: "audio must be played inside the app" }, 403);
  }
  const user = await currentUser(request, env) || await currentAudioUser(env, url);
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!/^[a-z0-9-]+$/.test(slug || "")) return json({ error: "not found" }, 404);
  if (user.tier === "free" && !FREE_AUDIO.has(slug)) {
    return json({ error: "locked — included with the full book" }, 403);
  }

  const audio = await env.SOFTLIFE_AUDIO.get("audio:" + slug, { type: "arrayBuffer" });
  if (!audio) return json({ error: "not found" }, 404);

  const size = audio.byteLength;
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": "audio/mpeg",
    "Content-Length": String(size),
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store"
  };

  const range = request.headers.get("Range") || "";
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (match) {
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { ...SECURITY_HEADERS, "Content-Range": "bytes */" + size }
      });
    }
    end = Math.min(end, size - 1);
    const chunk = audio.slice(start, end + 1);
    return new Response(chunk, {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": "bytes " + start + "-" + end + "/" + size
      }
    });
  }

  return new Response(audio, { headers });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    role: user.role || "member",
    ref_code: user.ref_code
  };
}

function bearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(request) {
  return String(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "").split(",")[0].trim();
}

async function logWebhook(env, status, data, orderId, email, error = "") {
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_webhook_logs (status, order_id, email, payload, error) VALUES (?, ?, ?, ?, ?)"
    ).bind(status, orderId, email, JSON.stringify(data || {}).slice(0, 4000), String(error || "").slice(0, 500)).run();
  } catch (exc) {
    // Ledger logging must never break the webhook.
  }
}

async function logSecurity(env, kind, email = "", ip = "", detail = "") {
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_security_log (kind, email, ip, detail) VALUES (?, ?, ?, ?)"
    ).bind(kind, String(email || "").slice(0, 120), String(ip || "").slice(0, 64), String(detail || "").slice(0, 500)).run();
  } catch (exc) {
    // Security logging must never break the request path.
  }
}

async function audit(env, actor, action, target, meta = {}) {
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_audit_logs (actor, action, target, meta) VALUES (?, ?, ?, ?)"
    ).bind(actor || "superadmin", action, target || "", JSON.stringify(meta)).run();
  } catch (exc) {
    // Audit logging must never break the request path.
  }
}

function capForRoute(path) {
  if (path.startsWith("/api/admin/analytics/")) return "analytics";
  if (path.startsWith("/api/admin/webhooks")) return "webhooks";
  if (path === "/api/admin/claims") return "webhooks";
  if (path === "/api/admin/security") return "security";
  if (path === "/api/admin/crm/stage") return "crm_stage";
  if (path === "/api/admin/crm/notes") return "crm_note";
  if (path.startsWith("/api/admin/crm")) return "crm";
  if (path.startsWith("/api/admin/team")) return "team";
  if (/^\/api\/admin\/users\/\d+\/tier$/.test(path)) return "set_tier";
  if (/^\/api\/admin\/users\/\d+\/role$/.test(path)) return "set_role";
  if (path === "/api/admin/overview") return "overview";
  if (path === "/api/admin/users") return "users";
  if (path === "/api/admin/referrals") return "referrals";
  if (path === "/api/admin/affiliate/payout") return "affiliate_payout";
  if (path.startsWith("/api/admin/email")) return "email";
  if (path === "/api/admin/purchases") return "purchases";
  if (path === "/api/admin/onboarding") return "onboarding";
  if (path === "/api/admin/audio") return "audio";
  if (path === "/api/admin/careers") return "careers";
  if (path === "/api/admin/geo") return "geo";
  if (path === "/api/admin/goals") return "goals";
  if (path.startsWith("/api/admin/blog")) return "blog";
  return null;
}

function roleAllowed(role, path) {
  const cap = capForRoute(path);
  return Boolean(cap) && ADMIN_CAPS[cap] instanceof Set && ADMIN_CAPS[cap].has(role);
}

async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "Admin login is not configured." }, 503);
  }
  const body = await readJson(request);
  const password = String(body.password || "");
  if (!safeEqual(password, env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 400));
    await logSecurity(env, "admin_login_failed", "", clientIp(request));
    return json({ error: "Wrong admin password." }, 401);
  }
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const hours = Math.min(72, Math.max(1, Number(env.ADMIN_SESSION_HOURS) || 12));
  await env.DB.prepare("DELETE FROM softlife_admin_sessions WHERE expires_at <= datetime('now')").run();
  await env.DB.prepare(
    "INSERT INTO softlife_admin_sessions (token_hash, expires_at) VALUES (?, datetime('now', ?))"
  ).bind(tokenHash, "+" + hours + " hours").run();
  return json({
    token,
    role: "superadmin",
    expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString()
  });
}

async function staffLogin(request, env) {
  const body = await readJson(request);
  const email = cleanText(body.email, 120).toLowerCase();
  const password = String(body.password || "");
  const row = await env.DB.prepare(
    "SELECT * FROM softlife_staff_users WHERE lower(email) = ? AND active = 1"
  ).bind(email).first();
  if (!row) {
    await new Promise((r) => setTimeout(r, 400));
    await logSecurity(env, "staff_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) {
    await new Promise((r) => setTimeout(r, 400));
    await logSecurity(env, "staff_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const hours = Math.min(72, Math.max(1, Number(env.ADMIN_SESSION_HOURS) || 12));
  await env.DB.prepare("DELETE FROM softlife_staff_sessions WHERE expires_at <= datetime('now')").run();
  await env.DB.prepare(
    "INSERT INTO softlife_staff_sessions (token_hash, staff_id, expires_at) VALUES (?, ?, datetime('now', ?))"
  ).bind(tokenHash, row.id, "+" + hours + " hours").run();
  return json({
    token,
    role: row.role,
    name: row.name,
    expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString()
  });
}

async function adminLogout(request, env) {
  const token = bearerToken(request);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM softlife_admin_sessions WHERE token_hash = ?").bind(tokenHash),
      env.DB.prepare("DELETE FROM softlife_staff_sessions WHERE token_hash = ?").bind(tokenHash),
    ]);
  }
  return json({ ok: true });
}

async function currentAdmin(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const legacy = await env.DB.prepare(
    "SELECT token_hash FROM softlife_admin_sessions WHERE token_hash = ? AND expires_at > datetime('now')"
  ).bind(tokenHash).first();
  if (legacy) {
    return { role: "superadmin", name: "Super-admin", actor: "superadmin" };
  }
  const staff = await env.DB.prepare(
    `SELECT s.id, s.email, s.name, s.role FROM softlife_staff_users s
     JOIN softlife_staff_sessions ss ON ss.staff_id = s.id
     WHERE ss.token_hash = ? AND ss.expires_at > datetime('now') AND s.active = 1`
  ).bind(tokenHash).first();
  if (staff) {
    return { role: staff.role, name: staff.name || staff.email, actor: staff.email, staffId: staff.id };
  }
  return null;
}

function renderCmsBlogPost(row) {
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const canonical = row.canonical || (SITE_URL + "/blog/" + row.slug + "/");
  const og = row.og_image || (SITE_URL + "/assets/blog/og-default.png");
  const date = String(row.updated_at || row.created_at || "").slice(0, 10);
  const dek = row.description || "";
  const author = row.author || "Deon ChristoLove";
  let faqHtml = "";
  let faqSchema = "";
  try {
    const faqs = JSON.parse(row.faq_json || "[]");
    if (faqs.length) {
      faqHtml = '<section class="post-faq"><h2>Questions people ask</h2>' + faqs.map((f) =>
        '<details><summary>' + esc(f.question) + '</summary><div><p>' + esc(f.answer) + '</p></div></details>'
      ).join("") + '</section>';
      faqSchema = ',{"@type":"FAQPage","mainEntity":' + JSON.stringify(faqs.map((f) => ({
        "@type": "Question", "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))) + '}';
    }
  } catch (e) { /* ignore malformed faq */ }
  const articleSchema = '{"@context":"https://schema.org","@type":"Article","headline":' + JSON.stringify(row.title)
    + ',"description":' + JSON.stringify(dek) + ',"image":[' + JSON.stringify(og) + '],"datePublished":' + JSON.stringify(date)
    + ',"dateModified":' + JSON.stringify(date) + ',"author":{"@type":"Person","name":' + JSON.stringify(author)
    + '},"publisher":{"@type":"Organization","name":"Gabochie Books","url":"https://soft.gabochie.com"},"mainEntityOfPage":{"@type":"WebPage","@id":'
    + JSON.stringify(canonical) + '},"keywords":' + JSON.stringify(row.tags || "") + ',"articleSection":' + JSON.stringify(row.category || "") + '}';
  const crumbSchema = '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://soft.gabochie.com/"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://soft.gabochie.com/blog/"},{"@type":"ListItem","position":3,"name":' + JSON.stringify(row.title) + ',"item":' + JSON.stringify(canonical) + '}]}';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2a0f4a">
<title>${esc(row.title)} — The Soft Life System</title>
<meta name="description" content="${esc(dek)}">
<meta name="author" content="${esc(author)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/css/app.css">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Soft Life System">
<meta property="og:title" content="${esc(row.title)}">
<meta property="og:description" content="${esc(dek)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(row.title)}">
<meta name="twitter:description" content="${esc(dek)}">
<meta name="twitter:image" content="${esc(og)}">
<script type="application/ld+json">${articleSchema}</script>
<script type="application/ld+json">${crumbSchema}</script>${faqSchema ? '<script type="application/ld+json">' + faqSchema + '</script>' : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="blog-top"><div class="wrap blog-bar">
<a class="logo" href="/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife-header.png" alt="Soft Life by Gabochie" width="316" height="150"></a>
<nav aria-label="Main" data-sl-surface="web_header"><a href="/products/">Products</a><a href="/tools/">Free tools</a><a href="/about/">About</a><a href="/#/signin">Sign in</a><a class="top-cta" href="/#/signup">Start free</a></nav>
</div></header>
<main id="main"><article>
<header class="post-hero"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Journal</a><span>/</span><span>${esc(row.category || "Article")}</span></nav>
<span class="tag">${esc(row.category || "Journal")}</span>
<h1>${esc(row.title)}</h1>
<p class="post-dek">${esc(dek)}</p>
<p class="post-meta">By <b>${esc(author)}</b> · <time datetime="${esc(date)}">${esc(date)}</time></p>
</div></header>
<div class="wrap post-layout"><div class="prose">
${row.body_html}
${faqHtml}
<div class="post-author"><div class="author-mark">DC</div><div><b>${esc(author)}</b><p>Writer, systems thinker and author of <i>The Soft Life System</i>.</p></div></div>
</div>
<aside class="post-aside" aria-label="Related"><div class="card"><span class="tag">The book + app</span><h3>Build the business that fits your life.</h3><p>Start free with the introduction and Chapter 1, then work the 90-day plan inside the app.</p><a class="btn gold wide" href="/#/signup">Start free →</a></div></aside>
</div></article>
<section class="cta-band"><div class="wrap center"><h2>Your soft life needs a system, not more hustle.</h2><p class="lede">Start with the free app: intro + Chapter 1 audio, the 90-day task plan, and the first steps of the system.</p><a class="btn gold big" href="/#/signup">Create my free account →</a></div></section>
</main>
<footer class="site-footer"><div class="wrap"><div class="footer-legal">© 2026 Deon ChristoLove · Gabochie Books. All rights reserved.</div></div></footer>
<script src="/js/nav-config.js"></script><script src="/js/nav.js" defer></script>
</body></html>`;
}

function validateBlogPost(body) {
  const title = cleanText(body.title, 160);
  const slugRaw = String(body.slug || "").toLowerCase().trim();
  const slug = slugRaw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  if (!title) return { error: "title is required" };
  if (!slug) return { error: "slug is required" };
  const bodyHtml = String(body.body_html || "").trim();
  if (bodyHtml.length < 40) return { error: "body_html must be at least 40 characters" };
  let faqJson = "[]";
  if (Array.isArray(body.faq) && body.faq.length) {
    const qs = body.faq.slice(0, 12).map((f) => ({
      question: cleanText(f.question, 200),
      answer: cleanText(f.answer, 1200)
    })).filter((f) => f.question && f.answer);
    faqJson = JSON.stringify(qs);
  }
  return {
    slug,
    title,
    description: cleanText(body.description, 300),
    author: cleanText(body.author, 80) || "Deon ChristoLove",
    category: cleanText(body.category, 60),
    tags: cleanText(body.tags, 200),
    canonical: cleanText(body.canonical, 200) || (SITE_URL + "/blog/" + slug + "/"),
    body_html: bodyHtml,
    faq_json: faqJson,
    og_image: cleanText(body.og_image, 200) || (SITE_URL + "/assets/blog/og-default.png"),
    published: body.published === true || body.published === 1 || body.published === "1"
  };
}

async function handleAdmin(request, env, url, path, admin = { role: "superadmin", actor: "superadmin" }) {
  if (path === "/api/admin/overview" && request.method === "GET") {
    const [users, week, month, tasks, done, referrals, purchases, revenue, onboarded, whatsapp, events7d] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE created_at >= datetime('now', '-7 days')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE created_at >= datetime('now', '-30 days')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_tasks"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_tasks WHERE done = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_referrals"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_purchases"),
      env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS s FROM softlife_purchases"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE completed_at IS NOT NULL"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE whatsapp_consent = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_events WHERE created_at >= datetime('now', '-7 days')")
    ]);
    const audio = await env.SOFTLIFE_AUDIO.list({ prefix: "audio:", limit: 100 });
    const uploaded = (audio.keys || []).map((k) => k.name.replace(/^audio:/, "")).sort();
    return json({
      users: countValue(users),
      signups7d: countValue(week),
      signups30d: countValue(month),
      tasks: countValue(tasks),
      tasksDone: countValue(done),
      referrals: countValue(referrals),
      purchases: countValue(purchases),
      revenue: revenue && revenue.results && revenue.results[0] ? revenue.results[0].s : 0,
      onboardingCompleted: countValue(onboarded),
      whatsappOptIn: countValue(whatsapp),
      events7d: countValue(events7d),
      audio: { uploaded, count: uploaded.length, expected: AUDIO_SLUGS.length },
      generatedAt: new Date().toISOString()
    });
  }

  if (path === "/api/admin/email" && request.method === "GET") {
    const [segAll, segFree, segPaid, segInactive, campaigns, log] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE marketing_consent = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE tier = 'free' AND marketing_consent = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE tier != 'free' AND marketing_consent = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE marketing_consent = 1 AND NOT EXISTS (SELECT 1 FROM softlife_sessions s WHERE s.user_id = softlife_users.id AND s.created_at >= datetime('now', '-14 days'))"),
      env.DB.prepare("SELECT id, subject, segment, recipients, sent, failed, created_at FROM softlife_email_campaigns ORDER BY id DESC LIMIT 20"),
      env.DB.prepare("SELECT to_email, subject, kind, status, error, created_at FROM softlife_email_log ORDER BY id DESC LIMIT 30")
    ]);
    return json({
      segments: { all: countValue(segAll), free: countValue(segFree), paid: countValue(segPaid), inactive: countValue(segInactive) },
      campaigns: campaigns.results || [],
      log: log.results || []
    });
  }

  if (path === "/api/admin/email/campaigns" && request.method === "POST") {
    const body = await readJson(request);
    const subject = cleanText(body.subject, 120);
    const segment = ["all", "free", "paid", "inactive"].includes(body.segment) ? body.segment : "";
    const bodyText = String(body.body || "").trim();
    if (!subject || !segment || bodyText.length < 20) {
      return json({ error: "subject, valid segment and a message of at least 20 characters are required" }, 400);
    }
    // Plain textarea -> simple HTML: escape everything, paragraphs + line breaks.
    const escHtml = cleanText(bodyText, 8000)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .split(/\n{2,}/).map((p) => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
    const where = {
      all: "marketing_consent = 1",
      free: "tier = 'free' AND marketing_consent = 1",
      paid: "tier != 'free' AND marketing_consent = 1",
      inactive: "marketing_consent = 1 AND NOT EXISTS (SELECT 1 FROM softlife_sessions s WHERE s.user_id = softlife_users.id AND s.created_at >= datetime('now', '-14 days'))"
    }[segment];
    const recipients = await env.DB.prepare(
      "SELECT id, email, name, unsub_token FROM softlife_users WHERE " + where
    ).all();
    const people = (recipients.results || []).filter((r) => r.email);
    if (!people.length) return json({ error: "no recipients in that segment" }, 400);
    const inserted = await env.DB.prepare(
      "INSERT INTO softlife_email_campaigns (subject, segment, body_html, body_text, recipients, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(subject, segment, escHtml, bodyText.slice(0, 8000), people.length, admin ? admin.role : "superadmin").run();
    const campaignId = inserted.meta.last_row_id;
    let sent = 0, failed = 0;
    for (const person of people) {
      let token = person.unsub_token;
      if (!token) {
        token = randomHex(16);
        await env.DB.prepare("UPDATE softlife_users SET unsub_token = ? WHERE id = ?").bind(token, person.id).run();
      }
      const html = emailShell(subject, escHtml
        + '<p style="font-size:12px;color:#6d5f7a;">You receive this because you have a Soft Life account. '
        + '<a href="' + url.origin + '/api/unsubscribe?token=' + token + '" style="color:#6d5f7a;">Unsubscribe</a></p>');
      const ok = await sendPurchaseEmail(env, person.email, subject, html, bodyText.slice(0, 8000), "campaign:" + campaignId);
      if (ok) sent++; else failed++;
    }
    await env.DB.prepare(
      "UPDATE softlife_email_campaigns SET sent = ?, failed = ? WHERE id = ?"
    ).bind(sent, failed, campaignId).run();
    return json({ ok: true, campaign_id: campaignId, recipients: people.length, sent, failed });
  }

  if (path === "/api/admin/email/sequences" && request.method === "POST") {
    const summary = await runEmailSequences(env);
    return json({ ok: true, summary });
  }

  if (path === "/api/admin/users" && request.method === "GET") {
    const q = String(url.searchParams.get("q") || "").trim();
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const like = "%" + q + "%";
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.name, u.tier, u.role, u.ref_code, u.created_at,
        (SELECT COUNT(*) FROM softlife_tasks t WHERE t.user_id = u.id) AS tasks,
        (SELECT COUNT(*) FROM softlife_tasks t WHERE t.user_id = u.id AND t.done = 1) AS done
       FROM softlife_users u
       WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?)
       ORDER BY u.id DESC LIMIT ? OFFSET ?`
    ).bind(q, like, like, limit, offset).all();
    return json({ users: rows.results || [], q, limit, offset });
  }

  const tierMatch = path.match(/^\/api\/admin\/users\/(\d+)\/tier$/);
  if (tierMatch && request.method === "POST") {
    const body = await readJson(request);
    const tier = String(body.tier || "");
    if (!["free", "complete"].includes(tier)) return json({ error: "invalid tier" }, 400);
    const row = await env.DB.prepare(
      "UPDATE softlife_users SET tier = ? WHERE id = ? RETURNING id, email, name, tier, role"
    ).bind(tier, Number(tierMatch[1])).first();
    if (!row) return json({ error: "not found" }, 404);
    await audit(env, admin.actor, "tier", "user:" + tierMatch[1], { value: tier });
    return json({ user: row });
  }

  const roleMatch = path.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (roleMatch && request.method === "POST") {
    const body = await readJson(request);
    const role = String(body.role || "");
    if (!["member", "admin", "superadmin"].includes(role)) return json({ error: "invalid role" }, 400);
    const row = await env.DB.prepare(
      "UPDATE softlife_users SET role = ? WHERE id = ? RETURNING id, email, name, tier, role"
    ).bind(role, Number(roleMatch[1])).first();
    if (!row) return json({ error: "not found" }, 404);
    await audit(env, admin.actor, "role", "user:" + roleMatch[1], { value: role });
    return json({ user: row });
  }

  if (path === "/api/admin/referrals" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, ref_code, email, status, created_at FROM softlife_referrals ORDER BY id DESC LIMIT 100"
    ).all();
    const stats = await env.DB.prepare(
      `SELECT r.ref_code, u.name AS affiliate_name, u.email AS affiliate_email,
         SUM(CASE WHEN r.status = 'clicked' THEN 1 ELSE 0 END) AS clicks,
         SUM(CASE WHEN r.status IN ('signed_up','purchased') THEN 1 ELSE 0 END) AS signups,
         (SELECT COUNT(*) FROM softlife_purchases p WHERE p.ref_code = r.ref_code) AS purchases,
         (SELECT COALESCE(SUM(e.amount), 0) FROM softlife_affiliate_earnings e WHERE e.ref_code = r.ref_code) AS earnings,
          (SELECT COALESCE(SUM(e.amount), 0) FROM softlife_affiliate_earnings e WHERE e.ref_code = r.ref_code AND e.status = 'pending') AS pending_earnings
       FROM softlife_referrals r
       LEFT JOIN softlife_users u ON u.ref_code = r.ref_code
       GROUP BY r.ref_code ORDER BY earnings DESC, clicks DESC LIMIT 50`
    ).all();
    return json({ referrals: rows.results || [], stats: stats.results || [] });
  }

  // Admin: mark all pending affiliate earnings for a ref_code as paid.
  if (path === "/api/admin/affiliate/payout" && request.method === "POST") {
    const body = await readJson(request);
    const refCode = String(body.ref_code || "").trim().toUpperCase().slice(0, 24);
    if (!refCode) return json({ error: "ref_code required" }, 400);
    const paymentMethod = String(body.payment_method || "").trim() || null;
    const payoutReference = String(body.payout_reference || "").trim() || null;
    const pending = await env.DB.prepare(
      "SELECT COALESCE(SUM(amount), 0) AS s, COUNT(*) AS c, "
      + "(SELECT name FROM softlife_users WHERE lower(email) = lower(a.email) LIMIT 1) AS affiliate_name, "
      + "(SELECT email FROM softlife_users WHERE lower(email) = lower(a.email) LIMIT 1) AS affiliate_email "
      + "FROM softlife_affiliate_earnings a WHERE ref_code = ? AND status = 'pending'"
    ).bind(refCode).first();
    const total = Math.round(Number(pending.s) * 100) / 100;
    const count = pending ? pending.c : 0;
    if (count === 0) return json({ ok: true, paid: 0, total: 0, message: "No pending earnings." });
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE softlife_affiliate_earnings SET status = 'paid', paid_at = datetime('now'), "
        + "payment_method = COALESCE(?, payment_method), payout_date = datetime('now'), "
        + "payout_reference = COALESCE(?, payout_reference) WHERE ref_code = ? AND status = 'pending'"
      ).bind(paymentMethod, payoutReference, refCode),
      env.DB.prepare(
        "INSERT INTO softlife_affiliate_payouts (ref_code, affiliate_name, affiliate_email, amount_cents, "
        + "payment_method, payout_reference, paid_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(refCode, pending.affiliate_name, pending.affiliate_email, Math.round(total * 100),
        paymentMethod, payoutReference, admin.actor || "superadmin")
    ]);
    await logSecurity(env, "affiliate_payout", refCode, clientIp(request), `paid ${count} earnings total ${total}`);
    return json({ ok: true, paid: count, total, ref_code: refCode, payment_method: paymentMethod });
  }

  if (path === "/api/admin/purchases" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, order_id, email, tier, amount, currency, provider, ref_code, created_at FROM softlife_purchases ORDER BY id DESC LIMIT 100"
    ).all();
    return json({ purchases: rows.results || [] });
  }

  if (path === "/api/admin/onboarding" && request.method === "GET") {
    const rows = await env.DB.prepare(
      `SELECT o.*, u.email, u.name, u.tier
       FROM softlife_onboarding o JOIN softlife_users u ON u.id = o.user_id
       ORDER BY o.updated_at DESC LIMIT 200`
    ).all();
    return json({ onboarding: rows.results || [] });
  }

  if (path === "/api/admin/audio" && request.method === "GET") {
    const audio = await env.SOFTLIFE_AUDIO.list({ prefix: "audio:", limit: 100 });
    const uploaded = (audio.keys || []).map((k) => k.name.replace(/^audio:/, "")).sort();
    return json({
      uploaded,
      missing: AUDIO_SLUGS.filter((s) => !uploaded.includes(s)),
      expected: AUDIO_SLUGS
    });
  }

  // ---------- product analytics ----------

  function dailySeries(rows, days, key) {
    const byDay = {};
    for (const row of rows) byDay[row.d] = Number(row.c || 0);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ day, [key]: byDay[day] || 0 });
    }
    return out;
  }

  if (path === "/api/admin/analytics/overview" && request.method === "GET") {
    const [usersTotal, dau, wau, mau, activated, velocity] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users"),
      env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-1 day')"),
      env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-7 days')"),
      env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-30 days')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM (SELECT user_id FROM softlife_events WHERE event = 'task_completed' GROUP BY user_id HAVING COUNT(*) >= 3)"),
      env.DB.prepare("SELECT AVG(julianday(e.first_done) - julianday(u.created_at)) AS v FROM softlife_users u JOIN (SELECT user_id, MIN(created_at) AS first_done FROM softlife_events WHERE event = 'task_completed' GROUP BY user_id) e ON e.user_id = u.id")
    ]);
    const users = countValue(usersTotal);
    const activatedCount = countValue(activated);
    const days = velocity && velocity.results && velocity.results[0] && velocity.results[0].v != null
      ? Math.round(Number(velocity.results[0].v) * 10) / 10 : null;
    const seriesRows = await env.DB.prepare(
      "SELECT date(created_at) AS d, COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-29 days') GROUP BY d"
    ).all();
    return json({
      users,
      dau: countValue(dau),
      wau: countValue(wau),
      mau: countValue(mau),
      activationRate: users ? Math.round((100 * activatedCount) / users) : 0,
      activatedUsers: activatedCount,
      daysToFirstTask: days,
      dailyActive: dailySeries(seriesRows.results || [], 30, "active"),
      generatedAt: new Date().toISOString()
    });
  }

  if (path === "/api/admin/analytics/audio" && request.method === "GET") {
    const [playsRows, completionsRows] = await env.DB.batch([
      env.DB.prepare("SELECT json_extract(meta, '$.slug') AS slug, COUNT(*) AS plays, COUNT(DISTINCT user_id) AS listeners FROM softlife_events WHERE event = 'audio_play' AND json_extract(meta, '$.slug') IS NOT NULL GROUP BY slug"),
      env.DB.prepare("SELECT json_extract(meta, '$.slug') AS slug, COUNT(*) AS completions FROM softlife_events WHERE event = 'audio_complete' AND json_extract(meta, '$.slug') IS NOT NULL GROUP BY slug")
    ]);
    const plays = {};
    for (const r of playsRows.results || []) plays[r.slug] = { plays: Number(r.plays || 0), listeners: Number(r.listeners || 0) };
    const completions = {};
    for (const r of completionsRows.results || []) completions[r.slug] = Number(r.completions || 0);
    const chapters = AUDIO_SLUGS.map((slug) => ({
      slug,
      plays: (plays[slug] || { plays: 0 }).plays,
      listeners: (plays[slug] || { listeners: 0 }).listeners,
      completions: completions[slug] || 0
    }));
    return json({ chapters, expected: AUDIO_SLUGS });
  }

  if (path === "/api/admin/analytics/tasks" && request.method === "GET") {
    const [weeks, topTasks, completedEvents, addedEvents] = await env.DB.batch([
      env.DB.prepare("SELECT COALESCE(week, 0) AS week, COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM softlife_tasks GROUP BY week ORDER BY week"),
      env.DB.prepare("SELECT title, week, COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM softlife_tasks GROUP BY title ORDER BY done DESC, total DESC LIMIT 16"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_events WHERE event = 'task_completed'"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_events WHERE event = 'task_added'")
    ]);
    return json({
      weeks: weeks.results || [],
      topTasks: topTasks.results || [],
      completedEvents: countValue(completedEvents),
      addedEvents: countValue(addedEvents)
    });
  }

  if (path === "/api/admin/analytics/onboarding" && request.method === "GET") {
    const fields = ["business_name", "business_stage", "country", "timezone", "main_goal",
      "biggest_challenge", "revenue_range", "team_size", "whatsapp_number"];
    const startedRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding").first();
    const started = Number(startedRow && startedRow.c || 0);
    const steps = [];
    for (const field of fields) {
      const filledRow = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM softlife_onboarding WHERE ${field} != ''`
      ).first();
      const filled = Number(filledRow && filledRow.c || 0);
      steps.push({ field, filled, rate: started ? Math.round((100 * filled) / started) : 0 });
    }
    const [completed, optIn] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE completed_at IS NOT NULL"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE whatsapp_consent = 1")
    ]);
    return json({
      started,
      completed: countValue(completed),
      whatsappOptIn: countValue(optIn),
      steps
    });
  }

  if (path === "/api/admin/analytics/engagement" && request.method === "GET") {
    const [pages, byEvent, seriesRows] = await env.DB.batch([
      env.DB.prepare("SELECT path, COUNT(*) AS views, COUNT(DISTINCT user_id) AS users FROM softlife_events WHERE event = 'page_view' GROUP BY path ORDER BY views DESC LIMIT 12"),
      env.DB.prepare("SELECT event, COUNT(*) AS c FROM softlife_events GROUP BY event ORDER BY c DESC"),
      env.DB.prepare("SELECT date(created_at) AS d, COUNT(*) AS c FROM softlife_events WHERE created_at >= datetime('now', '-13 days') GROUP BY d")
    ]);
    return json({
      pages: pages.results || [],
      byEvent: byEvent.results || [],
      dailyEvents: dailySeries(seriesRows.results || [], 14, "events")
    });
  }

  if (path === "/api/admin/analytics/content" && request.method === "GET") {
    const [posts, sources, referrers, seriesRows] = await env.DB.batch([
      env.DB.prepare("SELECT path, COUNT(*) AS views, COUNT(DISTINCT user_id) AS members, SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonymous FROM softlife_events WHERE event = 'page_view' AND path LIKE '/blog/%' GROUP BY path ORDER BY views DESC LIMIT 20"),
      env.DB.prepare("SELECT COALESCE(NULLIF(json_extract(meta, '$.utm_source'), ''), '(none)') AS utm, COUNT(*) AS c FROM softlife_events WHERE event = 'page_view' GROUP BY 1 ORDER BY c DESC LIMIT 8"),
      env.DB.prepare("SELECT COALESCE(NULLIF(json_extract(meta, '$.referrer'), ''), '(direct)') AS referrer, COUNT(*) AS c FROM softlife_events WHERE event = 'page_view' GROUP BY 1 ORDER BY c DESC LIMIT 10"),
      env.DB.prepare("SELECT date(created_at) AS d, COUNT(*) AS c FROM softlife_events WHERE event = 'page_view' AND created_at >= datetime('now', '-13 days') GROUP BY d")
    ]);
    const titles = Object.fromEntries(BLOG_POSTS.map(([slug, title]) => ["/blog/" + slug + "/", title]));
    const postRows = (posts.results || []).map((r) => ({ ...r, title: titles[r.path] || r.path }));
    return json({
      posts: postRows,
      expectedPosts: BLOG_POSTS.map(([slug]) => "/blog/" + slug + "/"),
      sources: sources.results || [],
      referrers: referrers.results || [],
      dailyViews: dailySeries(seriesRows.results || [], 14, "views"),
      generatedAt: new Date().toISOString()
    });
  }

  // ---------- security monitor ----------

  if (path === "/api/admin/security" && request.method === "GET") {
    const [last24, last7, memberSessions, adminSessions, staffSessions, recent, auditRows] = await env.DB.batch([
      env.DB.prepare("SELECT kind, COUNT(*) AS c FROM softlife_security_log WHERE created_at >= datetime('now', '-1 days') GROUP BY kind"),
      env.DB.prepare("SELECT kind, COUNT(*) AS c FROM softlife_security_log WHERE created_at >= datetime('now', '-7 days') GROUP BY kind"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_sessions WHERE expires_at > datetime('now')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_admin_sessions WHERE expires_at > datetime('now')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_staff_sessions WHERE expires_at > datetime('now')"),
      env.DB.prepare("SELECT id, kind, email, ip, detail, created_at FROM softlife_security_log ORDER BY id DESC LIMIT 50"),
      env.DB.prepare("SELECT id, actor, action, target, created_at FROM softlife_audit_logs ORDER BY id DESC LIMIT 25")
    ]);
    const toCounts = (res) => {
      const out = {};
      for (const r of (res.results || [])) out[r.kind] = Number(r.c || 0);
      return out;
    };
    return json({
      last24: toCounts(last24),
      last7: toCounts(last7),
      liveSessions: {
        member: countValue(memberSessions),
        admin: countValue(adminSessions),
        staff: countValue(staffSessions)
      },
      recent: recent.results || [],
      audit: auditRows.results || [],
      generatedAt: new Date().toISOString()
    });
  }

  // ---------- staff team (RBAC) ----------

  if (path === "/api/admin/team" && request.method === "GET") {
    const rows = await env.DB.prepare(
      `SELECT s.id, s.email, s.name, s.role, s.active, s.created_at,
        (SELECT COUNT(*) FROM softlife_staff_sessions ss WHERE ss.staff_id = s.id
         AND ss.expires_at > datetime('now')) AS sessions
       FROM softlife_staff_users s ORDER BY s.id`
    ).all();
    return json({ staff: rows.results || [], roles: STAFF_ROLES });
  }

  if (path === "/api/admin/team" && request.method === "POST") {
    const body = await readJson(request);
    const email = cleanText(body.email, 120).toLowerCase();
    const name = cleanText(body.name, 80);
    const role = String(body.role || "");
    const password = String(body.password || "");
    if (!email || !email.includes("@")) return json({ error: "A valid email is required." }, 400);
    if (!STAFF_ROLES.includes(role) || role === "superadmin") {
      return json({ error: "Pick a staff role: sales, support or content." }, 400);
    }
    if (password.length < 8) return json({ error: "Password needs at least 8 characters." }, 400);
    const exists = await env.DB.prepare(
      "SELECT id FROM softlife_staff_users WHERE lower(email) = ?"
    ).bind(email).first();
    if (exists) return json({ error: "That email already has a staff account." }, 409);
    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);
    const inserted = await env.DB.prepare(
      "INSERT INTO softlife_staff_users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)"
    ).bind(email, name, passwordHash, salt, role).run();
    const staffId = inserted.meta.last_row_id;
    await audit(env, admin.actor, "staff_added", "staff:" + staffId, { email, role });
    const row = await env.DB.prepare(
      "SELECT id, email, name, role, active, created_at FROM softlife_staff_users WHERE id = ?"
    ).bind(staffId).first();
    return json({ staff: row });
  }

  const teamActiveMatch = path.match(/^\/api\/admin\/team\/(\d+)\/active$/);
  if (teamActiveMatch && request.method === "POST") {
    const body = await readJson(request);
    const staffId = Number(teamActiveMatch[1]);
    const exists = await env.DB.prepare("SELECT id FROM softlife_staff_users WHERE id = ?").bind(staffId).first();
    if (!exists) return json({ error: "not found" }, 404);
    const active = body.active === true || body.active === 1 || body.active === "1" ? 1 : 0;
    await env.DB.prepare("UPDATE softlife_staff_users SET active = ? WHERE id = ?").bind(active, staffId).run();
    if (!active) {
      await env.DB.prepare(
        "DELETE FROM softlife_staff_sessions WHERE staff_id = ? AND expires_at > datetime('now')"
      ).bind(staffId).run();
    }
    await audit(env, admin.actor, active ? "staff_active" : "staff_deactivated", "staff:" + staffId, {});
    const row = await env.DB.prepare(
      "SELECT id, email, name, role, active, created_at FROM softlife_staff_users WHERE id = ?"
    ).bind(staffId).first();
    return json({ staff: row });
  }

  const teamRoleMatch = path.match(/^\/api\/admin\/team\/(\d+)\/role$/);
  if (teamRoleMatch && request.method === "POST") {
    const body = await readJson(request);
    const staffId = Number(teamRoleMatch[1]);
    const role = String(body.role || "");
    if (!STAFF_ROLES.includes(role) || role === "superadmin") {
      return json({ error: "Pick a staff role: sales, support or content." }, 400);
    }
    const exists = await env.DB.prepare("SELECT id FROM softlife_staff_users WHERE id = ?").bind(staffId).first();
    if (!exists) return json({ error: "not found" }, 404);
    await env.DB.prepare("UPDATE softlife_staff_users SET role = ? WHERE id = ?").bind(role, staffId).run();
    await audit(env, admin.actor, "staff_role", "staff:" + staffId, { role });
    const row = await env.DB.prepare(
      "SELECT id, email, name, role, active, created_at FROM softlife_staff_users WHERE id = ?"
    ).bind(staffId).first();
    return json({ staff: row });
  }

  // ---------- CRM ----------

  if (path === "/api/admin/crm" && request.method === "GET") {
    const uid = Number(url.searchParams.get("user_id")) || 0;
    const member = await env.DB.prepare(
      "SELECT id, email, name, tier, role, ref_code, referred_by, created_at FROM softlife_users WHERE id = ?"
    ).bind(uid).first();
    if (!member) return json({ error: "not found" }, 404);
    const [onb, purchases, timeline, signalsRows, stageRow, notes] = await env.DB.batch([
      env.DB.prepare("SELECT * FROM softlife_onboarding WHERE user_id = ?").bind(uid),
      env.DB.prepare("SELECT id, order_id, tier, amount, currency, provider, ref_code, created_at FROM softlife_purchases WHERE lower(email) = lower(?) ORDER BY id DESC").bind(member.email),
      env.DB.prepare("SELECT event, path, meta, created_at FROM softlife_events WHERE user_id = ? ORDER BY id DESC LIMIT 25").bind(uid),
      env.DB.prepare(`SELECT
        (SELECT COUNT(*) FROM softlife_tasks WHERE user_id = ?1 AND done = 1) AS tasksDone,
        (SELECT COUNT(*) FROM softlife_tasks WHERE user_id = ?1) AS tasksTotal,
        (SELECT COUNT(*) FROM softlife_events WHERE user_id = ?1 AND event = 'audio_play') AS audioStarted,
        (SELECT COUNT(*) FROM softlife_events WHERE user_id = ?1 AND event = 'audio_complete') AS audioCompleted,
        (SELECT COUNT(*) FROM softlife_events WHERE user_id = ?1 AND event = 'checkout_click') AS checkoutClicks`).bind(uid),
      env.DB.prepare("SELECT stage, updated_at FROM softlife_crm_pipeline WHERE user_id = ?").bind(uid),
      env.DB.prepare("SELECT id, note, author, created_at FROM softlife_crm_notes WHERE user_id = ? ORDER BY id DESC LIMIT 50").bind(uid)
    ]);
    const purchasesRows = purchases.results || [];
    const ltv = purchasesRows.reduce((sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0), 0);
    const signalsRow = signalsRows.results && signalsRows.results[0] ? signalsRows.results[0] : {};
    return json({
      member,
      onboarding: onb.results && onb.results[0] ? onb.results[0] : null,
      purchases: purchasesRows,
      ltv: Math.round(ltv * 100) / 100,
      timeline: timeline.results || [],
      signals: {
        tasksDone: Number(signalsRow.tasksDone || 0),
        tasksTotal: Number(signalsRow.tasksTotal || 0),
        audioStarted: Number(signalsRow.audioStarted || 0),
        audioCompleted: Number(signalsRow.audioCompleted || 0),
        checkoutClicks: Number(signalsRow.checkoutClicks || 0)
      },
      stage: stageRow.results && stageRow.results[0] ? stageRow.results[0].stage : "lead",
      stageUpdatedAt: stageRow.results && stageRow.results[0] ? stageRow.results[0].updated_at : null,
      notes: notes.results || []
    });
  }

  if (path === "/api/admin/crm/stage" && request.method === "POST") {
    const body = await readJson(request);
    const uid = Number(body.user_id) || 0;
    const stage = String(body.stage || "");
    if (!CRM_STAGES.includes(stage)) return json({ error: "invalid stage" }, 400);
    const exists = await env.DB.prepare("SELECT id FROM softlife_users WHERE id = ?").bind(uid).first();
    if (!exists) return json({ error: "not found" }, 404);
    await env.DB.prepare(
      `INSERT INTO softlife_crm_pipeline (user_id, stage, updated_by, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET stage = excluded.stage,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    ).bind(uid, stage, admin.actor).run();
    await audit(env, admin.actor, "crm_stage", "user:" + uid, { stage });
    return json({ ok: true });
  }

  if (path === "/api/admin/crm/notes" && request.method === "POST") {
    const body = await readJson(request);
    const uid = Number(body.user_id) || 0;
    const note = cleanText(body.note, 1000);
    if (!note) return json({ error: "Note is empty." }, 400);
    const exists = await env.DB.prepare("SELECT id FROM softlife_users WHERE id = ?").bind(uid).first();
    if (!exists) return json({ error: "not found" }, 404);
    await env.DB.prepare(
      "INSERT INTO softlife_crm_notes (user_id, note, author) VALUES (?, ?, ?)"
    ).bind(uid, note, admin.actor).run();
    await audit(env, admin.actor, "crm_note", "user:" + uid, { chars: note.length });
    return json({ ok: true });
  }

  // ---------- webhook ledger + replay ----------

  if (path === "/api/admin/webhooks" && request.method === "GET") {
    const [statsRows, last, deliveries] = await env.DB.batch([
      env.DB.prepare("SELECT status, COUNT(*) AS c FROM softlife_webhook_logs GROUP BY status"),
      env.DB.prepare("SELECT created_at FROM softlife_webhook_logs ORDER BY id DESC LIMIT 1"),
      env.DB.prepare("SELECT id, status, order_id, email, error, created_at, length(payload) AS payload_size FROM softlife_webhook_logs ORDER BY id DESC LIMIT 50")
    ]);
    const stats = { applied: 0, duplicate: 0, rejected: 0, invalid: 0, ignored: 0, failed: 0 };
    let total = 0;
    for (const r of (statsRows.results || [])) {
      if (r.status in stats) stats[r.status] = Number(r.c || 0);
      total += Number(r.c || 0);
    }
    return json({
      stats,
      total,
      lastDelivery: last.results && last.results[0] ? last.results[0].created_at : null,
      configured: Boolean(env.PURCHASE_WEBHOOK_SECRET),
      deliveries: deliveries.results || []
    });
  }

  if (path === "/api/admin/webhooks/replay" && request.method === "POST") {
    const body = await readJson(request);
    const wid = Number(body.id) || 0;
    const row = await env.DB.prepare(
      "SELECT id, payload FROM softlife_webhook_logs WHERE id = ?"
    ).bind(wid).first();
    if (!row) return json({ error: "not found" }, 404);
    let payload = {};
    try {
      payload = JSON.parse(row.payload || "{}");
    } catch (err) {
      payload = {};
    }
    const result = await applyPurchase(env, payload, new URL(request.url).origin, "replay");
    if (result.status === "failed") return json({ error: "replay failed" }, 500);
    await audit(env, admin.actor, "webhook_replayed", "webhook:" + wid, { result: result.status });
    return json({ ok: true, status: result.status, ...result.response });
  }

  // ---------- purchase access claims ----------

  if (path === "/api/admin/claims" && request.method === "GET") {
    const [pendingRows, completed, emails] = await env.DB.batch([
      env.DB.prepare(`SELECT id, email, order_id, tier, created_at, token,
        (SELECT status FROM softlife_email_log WHERE to_email = softlife_purchase_claims.email AND kind = 'claim'
         ORDER BY id DESC LIMIT 1) AS email_status
       FROM softlife_purchase_claims
       WHERE completed_at IS NULL AND created_at >= datetime('now', '-30 days') ORDER BY id DESC LIMIT 50`),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_purchase_claims WHERE completed_at IS NOT NULL"),
      env.DB.prepare("SELECT to_email, subject, kind, status, error, created_at FROM softlife_email_log ORDER BY id DESC LIMIT 20")
    ]);
    const origin = new URL(request.url).origin;
    const pending = (pendingRows.results || []).map((r) => {
      const token = r.token;
      delete r.token;
      return { ...r, claimUrl: `${origin}/#/claim?token=${token}` };
    });
    return json({ pending, completed: countValue(completed), emails: emails.results || [] });
  }

  // ---------- career applications ----------
  if (path === "/api/admin/careers" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, name, email, role, portfolio, availability, message, consent, ip, created_at "
      + "FROM softlife_job_applications ORDER BY created_at DESC LIMIT 200"
    ).all();
    return json({ applications: rows.results || [] });
  }

  // ---------- visitor geography ----------
  if (path === "/api/admin/geo" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT COALESCE(country, '(unknown)') AS country, COUNT(*) AS c, COUNT(DISTINCT user_id) AS members "
      + "FROM softlife_events WHERE created_at >= datetime('now', '-30 days') "
      + "GROUP BY country ORDER BY c DESC LIMIT 50"
    ).all();
    return json({ visits: (rows.results || []).map((r) => ({ country: r.country, count: r.c, members: r.members })) });
  }

  // ---------- blog CMS ----------
  if (path === "/api/admin/blog/posts" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, slug, title, description, author, category, tags, canonical, og_image, "
      + "published, created_at, updated_at FROM softlife_blog_posts ORDER BY updated_at DESC"
    ).all();
    return json({ posts: rows.results || [] });
  }

  if (path === "/api/admin/blog/posts" && request.method === "POST") {
    const body = await readJson(request);
    const post = validateBlogPost(body);
    if (post.error) return json({ error: post.error }, 400);
    const existing = await env.DB.prepare("SELECT id FROM softlife_blog_posts WHERE slug = ?").bind(post.slug).first();
    if (existing) return json({ error: "A post with that slug already exists." }, 400);
    await env.DB.prepare(
      "INSERT INTO softlife_blog_posts (slug, title, description, author, category, tags, canonical, body_html, faq_json, og_image, published) "
      + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(post.slug, post.title, post.description, post.author, post.category, post.tags,
      post.canonical, post.body_html, post.faq_json, post.og_image, post.published ? 1 : 0).run();
    await audit(env, admin.actor, "blog_post_created", "blog:" + post.slug, {});
    return json({ ok: true, slug: post.slug });
  }

  const blogEdit = path.match(/^\/api\/admin\/blog\/posts\/(\d+)$/);
  if (blogEdit && request.method === "POST") {
    const id = Number(blogEdit[1]);
    const body = await readJson(request);
    const post = validateBlogPost(body);
    if (post.error) return json({ error: post.error }, 400);
    const row = await env.DB.prepare("SELECT id FROM softlife_blog_posts WHERE id = ?").bind(id).first();
    if (!row) return json({ error: "Post not found." }, 404);
    await env.DB.prepare(
      "UPDATE softlife_blog_posts SET slug = ?, title = ?, description = ?, author = ?, category = ?, "
      + "tags = ?, canonical = ?, body_html = ?, faq_json = ?, og_image = ?, published = ?, updated_at = datetime('now') "
      + "WHERE id = ?"
    ).bind(post.slug, post.title, post.description, post.author, post.category, post.tags,
      post.canonical, post.body_html, post.faq_json, post.og_image, post.published ? 1 : 0, id).run();
    await audit(env, admin.actor, "blog_post_updated", "blog:" + post.slug, {});
    return json({ ok: true });
  }

  if (blogEdit && request.method === "DELETE") {
    const id = Number(blogEdit[1]);
    await env.DB.prepare("DELETE FROM softlife_blog_posts WHERE id = ?").bind(id).run();
    await audit(env, admin.actor, "blog_post_deleted", "blog:" + id, {});
    return json({ ok: true });
  }

  // ---------- financial goals ----------
  if (path === "/api/admin/goals" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, period, target_amount_cents, target_currency, created_at, updated_at "
      + "FROM softlife_financial_goals ORDER BY period DESC"
    ).all();
    return json({ goals: (rows.results || []).map((r) => ({
      id: r.id,
      period: r.period,
      target_amount: r.target_amount_cents / 100,
      currency: r.target_currency,
      created_at: r.created_at,
      updated_at: r.updated_at
    })) });
  }

  if (path === "/api/admin/goals" && request.method === "POST") {
    const body = await readJson(request);
    const period = String(body.period || "").trim();
    const target = Number(body.target_amount);
    const currency = String(body.target_currency || "USD").toUpperCase();
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return json({ error: "period must be YYYY-MM" }, 400);
    if (!target || target <= 0) return json({ error: "target_amount must be > 0" }, 400);
    await env.DB.prepare(
      "INSERT INTO softlife_financial_goals (period, target_amount_cents, target_currency) VALUES (?, ?, ?) "
      + "ON CONFLICT(period) DO UPDATE SET target_amount_cents = excluded.target_amount_cents, "
      + "target_currency = excluded.target_currency, updated_at = datetime('now')"
    ).bind(period, Math.round(target * 100), currency).run();
    return json({ ok: true });
  }

  return json({ error: "not found" }, 404);
}

function purchaseBodyEmail(body) {
  return String(
    body.email || body.customer_email || body.buyer_email || (body.customer && body.customer.email) || ""
  ).trim().toLowerCase();
}

function purchaseBodyOrderId(body) {
  return String(
    body.order_id || body.orderId || body.reference || body.id || (body.order && body.order.id) || ""
  ).trim() || null;
}

async function purchaseWebhook(request, env, ctx) {
  const secret = env.PURCHASE_WEBHOOK_SECRET || "";
  if (!secret && !env.PAYHIP_API_KEY) return json({ error: "purchase webhook not configured" }, 503);
  const url = new URL(request.url);
  // Auth can arrive as: Bearer header, X-Webhook-Secret header, or ?secret= in the
  // URL (for providers like Selar that post with no custom headers at all).
  const provided = bearerToken(request) || request.headers.get("X-Webhook-Secret")
    || url.searchParams.get("secret") || url.searchParams.get("key") || "";
  const body = await readJson(request);
  const orderId = purchaseBodyOrderId(body);
  const email = purchaseBodyEmail(body);
  const reject = async () => {
    await logWebhook(env, "rejected", body, orderId, email);
    await logSecurity(env, "webhook_rejected", email, clientIp(request), `order_id=${orderId || ""}`);
    return json({ error: "unauthorized" }, 401);
  };
  if (provided) {
    if (!secret || !safeEqual(provided, secret)) return reject();
  } else {
    // Payhip posts with no auth header; it signs the payload with sha256(apiKey).
    const payhipKey = env.PAYHIP_API_KEY || "";
    const isPayhipShape = Boolean(body.type && body.signature);
    if (!isPayhipShape || !payhipKey || !safeEqual(String(body.signature), await sha256Hex(payhipKey))) {
      return reject();
    }
  }
  // Acknowledge immediately and finish processing in the background — callers like
  // Zapier's free Code step enforce a 1-second wall clock, and the purchase email
  // can take longer than that.
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(Promise.resolve().then(() => applyPurchase(env, body, url.origin))
      .then((r) => console.error("purchase applied:", r.status, orderId || email))
      .catch((err) => console.error("purchase apply failed:", err)));
    return json({ ok: true, received: true });
  }
  const result = await applyPurchase(env, body, url.origin);
  if (result.status === "failed") return json({ error: "webhook processing failed" }, 500);
  return json(result.response, result.status === "invalid" ? 400 : 200);
}

async function applyPurchase(env, body, origin, source = "webhook") {
  // Validate + record a purchase payload and upgrade the buyer's tier.
  // Mirrors _process_purchase in the local server. Returns {status, response}
  // where status is applied | duplicate | invalid | failed.
  const email = purchaseBodyEmail(body);
  const orderId = purchaseBodyOrderId(body);
  const tier = String(body.tier || "complete").toLowerCase() === "free" ? "free" : "complete";
  try {
    // Payhip also fires "refunded"; it is not a sale, so accept and ignore it
    // (returning 200 stops Payhip's retry loop without recording a purchase).
    if (String(body.type || "") === "refunded") {
      await logWebhook(env, "ignored", body, orderId, email, "refund event - not a sale");
      return { status: "ignored", response: { ok: true, ignored: true } };
    }
    if (!email || !email.includes("@")) {
      await logWebhook(env, "invalid", body, orderId, email);
      return { status: "invalid", response: { error: "valid email required" } };
    }
    if (orderId) {
      const duplicate = await env.DB.prepare(
        "SELECT id FROM softlife_purchases WHERE order_id = ?"
      ).bind(orderId).first();
      if (duplicate) {
        await logWebhook(env, "duplicate", body, orderId, email);
        return { status: "duplicate", response: { ok: true, duplicate: true } };
      }
    }

    // Payhip sends prices in cents ("price": 900 = $9.00) and marks its events
    // with type/items; Selar-style payloads carry amount/total in major units.
    const payhip = String(body.type || "").startsWith("paid") || Array.isArray(body.items);
    let amount = Number(body.amount ?? body.total ?? 0);
    if (!amount && body.price != null) amount = payhip ? Number(body.price) / 100 : Number(body.price);
    const currency = String(body.currency || "").toUpperCase() || null;
    const provider = String(body.provider || (payhip ? "payhip" : "selar")).slice(0, 40);

    // Attribution: if the buyer was referred, the affiliate gets credit.
    const buyer = await env.DB.prepare("SELECT id, referred_by FROM softlife_users WHERE email = ?").bind(email).first();
    const refCode = String(buyer && buyer.referred_by ? buyer.referred_by : (body.ref || "")).trim().toUpperCase().slice(0, 24) || null;
    const insertResult = await env.DB.prepare(
      "INSERT INTO softlife_purchases (order_id, email, tier, amount, currency, provider, ref_code, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(orderId, email, tier, amount, currency, provider, refCode, JSON.stringify(body).slice(0, 4000)).run();
    const purchaseId = insertResult.meta && insertResult.meta.last_row_id;

    if (refCode && Number(amount) > 0) {
      // Credit the affiliate: 30% of the sale, pending until you pay it out.
      const affiliate = await env.DB.prepare("SELECT id FROM softlife_users WHERE ref_code = ?").bind(refCode).first();
      if (affiliate) {
        await env.DB.prepare(
          "INSERT INTO softlife_affiliate_earnings (ref_code, purchase_id, email, amount, currency, rate) VALUES (?, ?, ?, ?, ?, 0.30)"
        ).bind(refCode, purchaseId, email, Math.round(Number(amount) * 0.30 * 100) / 100, currency).run();
        await env.DB.prepare(
          "UPDATE softlife_referrals SET status = 'purchased' WHERE ref_code = ? AND lower(email) = ? AND status != 'purchased'"
        ).bind(refCode, email).run();
        // Notify the affiliate of the sale (best-effort).
        const affiliateUser = await env.DB.prepare(
          "SELECT email, name FROM softlife_users WHERE ref_code = ?"
        ).bind(refCode).first();
        if (affiliateUser && affiliateUser.email) {
          const saleCommission = Math.round(Number(amount) * 0.30 * 100) / 100;
          const affiliateHtml = emailShell(
            "You earned a commission 🎉",
            "<p>Hi " + escHtml(affiliateUser.name || "there") + ",</p>"
            + "<p>Someone you referred just bought the Complete bundle. <b>" + saleCommission + " " + escHtml(currency || "") + "</b> "
            + "has been credited to your pending balance.</p>"
            + "<p>Your lifetime earnings and stats are on your affiliate dashboard inside the app.</p>"
          );
          const affiliateText = "You earned a commission: " + saleCommission + " " + (currency || "")
            + " has been credited to your pending balance. Check your affiliate dashboard for details.";
          await sendPurchaseEmail(env, affiliateUser.email, "You earned a commission 🎉",
            affiliateHtml, affiliateText, "affiliate_sale");
        }
      }
    }

    if (buyer) {
      await env.DB.prepare("UPDATE softlife_users SET tier = ? WHERE id = ?").bind(tier, buyer.id).run();
      await env.DB.prepare(
        "UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE email = ? AND completed_at IS NULL"
      ).bind(email).run();
      await sendPurchaseEmail(env, email, "Your Soft Life System purchase is confirmed ✅",
                              purchaseConfirmationHtml(), purchaseConfirmationText(), "purchase_confirmation");
      await logWebhook(env, "applied", body, orderId, email);
      return { status: "applied", response: { ok: true, upgraded: true } };
    }
    // Stranger-buy flow: no account yet, mint a one-time claim link.
    const claimToken = randomHex(16);
    await env.DB.prepare(
      "INSERT INTO softlife_purchase_claims (email, token, order_id, tier) VALUES (?, ?, ?, ?)"
    ).bind(email, claimToken, orderId, tier).run();
    const claimLink = `${origin}/#/claim?token=${claimToken}`;
    await sendPurchaseEmail(env, email, "Your Soft Life System access is ready 🎉",
                            claimEmailHtml(claimLink), claimEmailText(claimLink), "claim");
    await logWebhook(env, "applied", body, orderId, email);
    return { status: "applied", response: { ok: true, upgraded: false, claim: true } };
  } catch (exc) {
    await logWebhook(env, "failed", body, orderId, email,
      source === "replay" ? `replay: ${String(exc).slice(0, 400)}` : String(exc).slice(0, 500));
    return { status: "failed", response: { error: "webhook processing failed" } };
  }
}

function emailShell(title, bodyHtml) {
  return (
    '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2a0f4a;">'
    + `<h2 style="color:#5d2189;margin:0 0 12px;">${title}</h2>`
    + `<div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>`
    + '<p style="font-size:12px;color:#6d5f7a;margin-top:28px;">The Soft Life System · Gabochie Books<br>'
    + "Questions? Just reply to this email.</p>"
    + "</div>"
  );
}

function claimEmailHtml(link) {
  return emailShell(
    "Your access is ready 🎉",
    "<p>Your payment went through — welcome to The Soft Life System.</p>"
    + "<p>One last step: choose a password and open your system. Your purchase is already "
    + "attached to this email, so everything unlocks the moment you land inside.</p>"
    + `<p><a href="${link}" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;`
    + 'border-radius:10px;text-decoration:none;font-weight:600;">Set my password &amp; start →</a></p>'
    + `<p style="font-size:13px;">Or paste this link into your browser:<br><code>${link}</code></p>`
    + '<p style="font-size:13px;color:#6d5f7a;">This link works once and stays valid for 30 days.</p>'
  );
}

function resetEmailHtml(link) {
  return emailShell(
    "Password reset 🔑",
    "<p>Someone (hopefully you) asked to reset the password for this email.</p>"
    + "<p>Click below to choose a new password. The link works once and expires in 60 minutes.</p>"
    + `<p><a href="${link}" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;`
    + 'border-radius:10px;text-decoration:none;font-weight:600;">Choose a new password →</a></p>'
    + `<p style="font-size:13px;">Or paste this link into your browser:<br><code>${link}</code></p>`
    + '<p style="font-size:13px;color:#6d5f7a;">Not you? Ignore this email — your password stays unchanged.</p>'
  );
}

function resetEmailText(link) {
  return "Password reset for The Soft Life System.\n\n"
    + "Choose a new password: " + link + "\n\n"
    + "This link works once and expires in 60 minutes. "
    + "If you didn't request this, ignore this email - your password stays unchanged.";
}

function purchaseConfirmationHtml() {
  return emailShell(
    "Purchase confirmed ✅",
    "<p>Your purchase of the complete system is confirmed and your account has been upgraded.</p>"
    + "<p>Sign in and start with the introduction, then work the 90-day plan at your pace.</p>"
  );
}

function claimEmailText(link) {
  return [
    "Your payment went through — welcome to The Soft Life System.",
    "",
    "One last step: choose a password and open your system. Your purchase is",
    "already attached to this email, so everything unlocks the moment you land inside.",
    "",
    "Set your password here:",
    link,
    "",
    "This link works once and stays valid for 30 days.",
    "",
    "The Soft Life System · Gabochie Books",
    "Questions? Just reply to this email.",
  ].join("\n");
}

function purchaseConfirmationText() {
  return [
    "Your purchase of the complete system is confirmed and your account has been upgraded.",
    "",
    "Sign in and start with the introduction, then work the 90-day plan at your pace.",
    "",
    "The Soft Life System · Gabochie Books",
    "Questions? Just reply to this email.",
  ].join("\n");
}

// ---- Automated email sequences (cron-driven; also triggerable from admin) ----
const SEQUENCE_LIMIT = 50;

async function runEmailSequences(env) {
  const out = {};
  out.welcome_d1 = await sendSequence(env, "welcome_d1", 50,
    `SELECT id, email, name, unsub_token FROM softlife_users
     WHERE tier = 'free' AND marketing_consent = 1
       AND created_at >= datetime('now', '-2 days') AND created_at <= datetime('now', '-1 day')
       AND NOT EXISTS (SELECT 1 FROM softlife_email_log l WHERE l.to_email = softlife_users.email AND l.kind = 'welcome_d1')`,
    (env, u) => welcomeEmail(env, u, 1));
  out.welcome_d3 = await sendSequence(env, "welcome_d3", 50,
    `SELECT id, email, name, unsub_token FROM softlife_users
     WHERE tier = 'free' AND marketing_consent = 1
       AND created_at >= datetime('now', '-4 days') AND created_at <= datetime('now', '-3 days')
       AND NOT EXISTS (SELECT 1 FROM softlife_email_log l WHERE l.to_email = softlife_users.email AND l.kind = 'welcome_d3')`,
    (env, u) => welcomeEmail(env, u, 3));
  out.upsell = await sendSequence(env, "upsell", SEQUENCE_LIMIT,
    `SELECT id, email, name, unsub_token FROM softlife_users
     WHERE tier = 'free' AND marketing_consent = 1
       AND created_at <= datetime('now', '-5 days')
       AND NOT EXISTS (SELECT 1 FROM softlife_purchases p WHERE lower(p.email) = lower(softlife_users.email))
       AND NOT EXISTS (SELECT 1 FROM softlife_email_log l WHERE l.to_email = softlife_users.email AND l.kind = 'upsell')`,
    upsellEmail);
  out.winback = await sendSequence(env, "winback", SEQUENCE_LIMIT,
    `SELECT id, email, name, unsub_token FROM softlife_users
     WHERE marketing_consent = 1 AND created_at <= datetime('now', '-14 days')
       AND NOT EXISTS (SELECT 1 FROM softlife_sessions s WHERE s.user_id = softlife_users.id AND s.created_at >= datetime('now', '-14 days'))
       AND NOT EXISTS (SELECT 1 FROM softlife_email_log l WHERE l.to_email = softlife_users.email AND l.kind = 'winback' AND l.created_at >= datetime('now', '-30 days'))`,
    winbackEmail);
  return out;
}

async function sendSequence(env, kind, limit, query, template) {
  const rows = await env.DB.prepare(query + " LIMIT " + limit).all();
  const people = (rows.results || []).filter((r) => r.email);
  let sent = 0;
  for (const person of people) {
    let token = person.unsub_token;
    if (!token) {
      token = randomHex(16);
      await env.DB.prepare("UPDATE softlife_users SET unsub_token = ? WHERE id = ?").bind(token, person.id).run();
    }
    const built = template(env, person);
    const ok = await sendPurchaseEmail(env, person.email, built.subject, built.html, built.text, kind);
    if (ok) sent++;
  }
  return { candidates: people.length, sent };
}

function unsubFooter(token, origin) {
  return '<p style="font-size:12px;color:#6d5f7a;">You receive this because you have a Soft Life account. '
    + '<a href="' + origin + '/api/unsubscribe?token=' + token + '" style="color:#6d5f7a;">Unsubscribe</a></p>';
}

function welcomeEmail(env, user, day) {
  const origin = env.SITE_URL || "https://soft.gabochie.com";
  const first = (user.name || "friend").split(" ")[0];
  if (day === 1) {
    return {
      subject: first + ", your first chapter is waiting",
      html: emailShell("Day 1 — start the 90 days",
        '<p>You created your Soft Life account yesterday — and the first chapter is the most important one.</p>'
        + '<p><b>Start with the Hustle Hangover Checklist</b> in your dashboard. It takes 10 minutes and it will show you exactly where your time actually goes.</p>'
        + '<p>Log in any time: <a href="' + origin + '/#/dashboard">' + origin + '/#/dashboard</a></p>'
        + '<p style="font-style:italic;">The soft life isn\'t a luxury. It\'s a design — and you\'ve started.</p>')
      + unsubFooter(user.unsub_token, origin),
      text: "Day 1 - start the 90 days. Your first task: the Hustle Hangover Checklist (10 minutes). Log in: " + origin + "/#/dashboard"
    };
  }
  return {
    subject: "Two days in — the Four Audits",
    html: emailShell("Day 3 — see your real picture",
      '<p>By now the hustle hangover should look familiar. The next step is the <b>Four Audits</b>: Time, Money, Energy, Joy.</p>'
      + '<p>Score all eight dimensions of your life with the Soft Life Scorecard in your dashboard. Most people find two or three dimensions are carrying everything — that\'s the architecture problem this system fixes.</p>'
      + '<p><a href="' + origin + '/#/tasks">Open your tasks</a></p>')
    + unsubFooter(user.unsub_token, origin),
    text: "Day 3 - complete the Four Audits (Time, Money, Energy, Joy) and score your Soft Life Scorecard."
  };
}

function upsellEmail(env, user) {
  const origin = env.SITE_URL || "https://soft.gabochie.com";
  const checkout = env.SELAR_CHECKOUT_URL || env.CHECKOUT_URL || "";
  const first = (user.name || "friend").split(" ")[0];
  return {
    subject: first + ", chapters 2-15 are waiting",
    html: emailShell("You\'ve seen the free chapters. Here\'s the rest.",
      '<p>The intro and Chapter 1 show you the problem. <b>Chapters 2–15 build the actual system:</b> the SOFT Method, the One-Offer Principle, the Delivery Machine, the 15-Hour Week Blueprint and the full 90-Day Launch Plan.</p>'
      + '<p>Everything is in the app — the complete eBook, all 15 chapters as audio, and every worksheet. One purchase, no subscription.</p>'
      + (checkout ? '<p><a href="' + checkout + '">Get the Complete bundle</a></p>' : '')
      + '<p style="font-size:12px;color:#6d5f7a;">Founding price stays open while the first cohort is in.</p>')
    + unsubFooter(user.unsub_token, origin),
    text: "Chapters 2-15 are waiting: the SOFT Method, the One-Offer Principle, the 15-Hour Week Blueprint and the 90-Day Launch Plan. One purchase, no subscription." + (checkout ? " Get it: " + checkout : "")
  };
}

function winbackEmail(env, user) {
  const origin = env.SITE_URL || "https://soft.gabochie.com";
  const first = (user.name || "friend").split(" ")[0];
  return {
    subject: first + ", your system has been waiting",
    html: emailShell("It\'s been a couple of weeks",
      '<p>Your dashboard keeps everything where you left it — your tasks, your scorecard, your audio.</p>'
      + '<p>Pick the one task you can finish in 10 minutes today. Momentum beats motivation.</p>'
      + '<p><a href="' + origin + '/#/dashboard">Back to your dashboard</a></p>')
    + unsubFooter(user.unsub_token, origin),
    text: "It's been a couple of weeks. Your dashboard keeps everything where you left it. Pick one 10-minute task today: " + origin + "/#/dashboard"
  };
}

async function sendPurchaseEmail(env, toEmail, subject, html, text, kind) {
  // Best-effort transactional email via Brevo (ex-Sendinblue). Never throws:
  // the webhook must not fail because the mail provider hiccuped. Every
  // attempt is logged to softlife_email_log for the admin claims card.
  let status = "skipped";
  let error = "";
  const apiKey = env.BREVO_API_KEY || "";
  if (apiKey) {
    const senderEmail = env.BREVO_SENDER || env.SUPPORT_EMAIL || "admin@gabochie.com";
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: env.EMAIL_FROM_NAME || "The Soft Life System" },
          to: [{ email: toEmail }],
          replyTo: { email: env.SUPPORT_EMAIL || senderEmail },
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      if (res.ok || res.status === 201) {
        status = "sent";
      } else {
        status = "failed";
        error = `brevo ${res.status}: ${(await res.text()).slice(0, 250)}`;
      }
    } catch (exc) {
      status = "failed";
      error = String(exc).slice(0, 250);
    }
  } else {
    error = "BREVO_API_KEY not set";
  }
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_email_log (to_email, subject, kind, status, error) VALUES (?, ?, ?, ?, ?)"
    ).bind(toEmail, subject.slice(0, 200), kind, status, error).run();
  } catch (exc) {
    // Logging must never break the webhook either.
  }
  return status === "sent";
}

// ---------- Interactive lead magnets (free tools) ----------

function escHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function scorecardResult(answers) {
  const rows = SCORECARD_DIMENSIONS.map((d, i) => ({ ...d, score: answers[i], order: i }));
  const total = answers.reduce((a, b) => a + b, 0);
  const sorted = [...rows].sort((a, b) => a.score - b.score || a.order - b.order);
  const bottom = sorted.slice(0, 2);
  const top = sorted.slice(-2).reverse();
  let band;
  if (total >= 70) band = { label: "Soft life, protected", text: "You're already living the soft life. Use this system to protect it — most people lose it the moment they scale." };
  else if (total >= 50) band = { label: "The danger zone", text: "You're in the danger zone. Two or three dimensions are carrying everything and the rest are quietly collapsing. Fix the bottom two first." };
  else if (total >= 30) band = { label: "A job, not a business", text: "You've built a job, not a business. Revenue is real and so is the exhaustion. The architecture needs rebuilding — that's what this system is for." };
  else band = { label: "The hustle hangover", text: "You're in the hustle hangover. Stop adding. Start subtracting. Today." };
  const headline = `Your lowest two are ${bottom[0].label} and ${bottom[1].label}. They are not separate problems — they are one architecture problem wearing two costumes.`;
  const actions = [bottom[0].action, bottom[1].action, "Re-score in 30 days. Fix the architecture, don't push harder on the symptoms."];
  return {
    total, band, headline,
    bottom: bottom.map((d) => d.key),
    top: top.map((d) => d.key),
    actions,
    rows: rows.map(({ key, label, ten, score }) => ({ key, label, ten, score })),
    focusNote: bottom[0].key === "focus"
      ? "Nothing else matters until you pick one offer."
      : bottom[0].key === "time"
        ? "You don't need a planner — you need to eliminate, automate, template and delegate."
        : "The fix is upstream — in your offer, your delivery and your week."
  };
}

function leadEmailHtml(link, result, name, unsubToken, origin) {
  const bottomLabels = SCORECARD_DIMENSIONS
    .filter((d) => result.bottom.includes(d.key)).map((d) => d.label).join(" and ");
  return emailShell(
    "Your Soft Life Scorecard is ready 🧭",
    "<p>" + escHtml(name) + ", you scored your life and business. Here is your personal report.</p>"
    + `<p><b>${result.total}/80 — ${escHtml(result.band.label)}.</b> ${escHtml(result.band.text)}</p>`
    + `<p>Your two lowest dimensions are <b>${escHtml(bottomLabels)}</b>.</p>`
    + '<p><a href="' + link + '" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;'
    + 'border-radius:10px;text-decoration:none;font-weight:600;">Open my printable report →</a></p>'
    + '<p style="font-size:13px;">Or paste this link into your browser:<br><code>' + link + '</code></p>'
    + '<p style="font-size:13px;color:#6d5f7a;">The page has a Print / Save as PDF button. This is your private copy — keep the link.</p>'
    + unsubFooter(unsubToken, origin)
  );
}

async function scorecardSubmit(request, env) {
  const body = await readJson(request);
  // Honeypot: bots fill the hidden field; silently accept so they move on.
  if (cleanText(body.website, 60)) return json({ ok: true, token: "", url: "" });
  const email = cleanText(body.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (body.consent !== true && body.consent !== 1 && body.consent !== "1") {
    return json({ error: "Please tick the consent box so we can email your report." }, 400);
  }
  const name = cleanText(body.name, 80) || email.split("@")[0];
  const raw = body.answers;
  if (!Array.isArray(raw) || raw.length !== 8) return json({ error: "Score all 8 dimensions." }, 400);
  const answers = raw.map((v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 10 ? n : 0;
  });
  if (answers.some((n) => n === 0)) return json({ error: "Each score must be a whole number from 1 to 10." }, 400);

  const ip = clientIp(request);
  try {
    const recentEmail = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM softlife_lead_submissions WHERE email = ? AND created_at >= datetime('now','-60 seconds')"
    ).bind(email).first();
    if (countValue(recentEmail) > 0) return json({ error: "That report was just created. Check your inbox." }, 429);
    if (ip) {
      const recentIp = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM softlife_lead_submissions WHERE ip = ? AND created_at >= datetime('now','-60 seconds')"
      ).bind(ip).first();
      if (countValue(recentIp) >= 3) return json({ error: "Too many requests. Try again in a minute." }, 429);
    }
  } catch (exc) {
    console.error("lead rate-limit check failed", exc);
  }

  const result = scorecardResult(answers);
  const token = randomHex(16);
  const unsubToken = randomHex(16);
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_lead_submissions (token, magnet, email, name, answers, result, consent, consent_version, unsub_token, ip) "
      + "VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)"
    ).bind(token, "scorecard", email, name, JSON.stringify(answers), JSON.stringify(result), CONSENT_VERSION,
           unsubToken, ip.slice(0, 64)).run();
  } catch (exc) {
    console.error("lead submission insert failed", exc);
    return json({ error: "We couldn't save your result. Please try again." }, 500);
  }

  const origin = env.SITE_URL || SITE_URL;
  const link = origin + "/tools/scorecard-result.html?t=" + token;
  const text = name + ", you scored " + result.total + "/80 — " + result.band.label
    + ". Your two lowest dimensions: " + SCORECARD_DIMENSIONS.filter((d) => result.bottom.includes(d.key))
      .map((d) => d.label).join(" and ") + ". Open your printable report: " + link;
  const emailed = await sendPurchaseEmail(env, email, "Your Soft Life Scorecard is ready 🧭",
    leadEmailHtml(link, result, name, unsubToken, origin), text, "lead_scorecard");
  return json({ ok: true, token, url: link, emailed });
}

// ---------- Interactive lead magnet: 15-Hour Workweek Audit ----------
function auditResult(activities) {
  const total = activities.reduce((s, a) => s + (Number(a.hours) || 0), 0);
  const lowValue = activities.filter((a) => a.worth !== "yes").reduce((s, a) => s + (Number(a.hours) || 0), 0);
  const lowPct = total ? Math.round((lowValue / total) * 100) : 0;
  const top = [...activities].sort((a, b) => (Number(b.hours) || 0) - (Number(a.hours) || 0))[0] || { name: "", hours: 0 };
  const filters = activities.map((a, i) => ({ name: a.name, action: a.filter || "keep" }));
  const eliminated = filters.filter((f) => f.action === "eliminate").length;
  const automated = filters.filter((f) => f.action === "automate").length;
  const templated = filters.filter((f) => f.action === "template").length;
  const delegated = filters.filter((f) => f.action === "delegate").length;
  const kept = filters.filter((f) => f.action === "keep").length;
  const reclaimable = activities.filter((a) => a.filter && a.filter !== "keep").reduce((s, a) => s + (Number(a.hours) || 0), 0);
  let bandLabel, bandText;
  if (total >= 50) { bandLabel = "The employee, not the founder"; bandText = "You're not running a business — you're running a job with extra steps. Nothing is deletable because everything feels urgent. The fix is upstream: fewer offers, fewer clients, clearer boundaries."; }
  else if (total >= 35) { bandLabel = "The busy founder"; bandText = "Revenue is real and so is the exhaustion. You have 15-20 hours of real work buried inside 40+ hours of noise. The Transfer Ladder will find them."; }
  else if (total >= 20) { bandLabel = "Almost there"; bandText = "You're close. A few eliminations and one delegation will get you to 15 hours of real work."; }
  else { bandLabel = "Already soft"; bandText = "You've already designed your week well. Protect it — most people lose it the moment they scale."; }
  const insights = [];
  if (lowPct >= 60) insights.push(lowPct + "% of your week is low-value work. That's not a time problem — it's an offer problem. You're serving too many people with too many things.");
  if (top.hours >= 15) insights.push("Your biggest time sink is " + top.name + " at " + top.hours + " hours/week. That single task is eating a third of your week.");
  if (activities.some((a) => a.worth === "no" && a.hours >= 5)) insights.push("You have tasks you rated 'not worth it' that still consume hours. Those are the first to eliminate — no one will notice.");
  if (kept >= 4) insights.push("You marked " + kept + " activities as 'keep'. Be ruthless — deep work should be 15 hours max. Everything else is noise.");
  if (insights.length === 0) insights.push("Your week is reasonably well-structured. Focus on the 3 tasks with the highest hours and apply the Transfer Ladder.");
  const actions = [
    "Eliminate " + eliminated + " task(s), automate " + automated + ", template " + templated + ", delegate " + delegated + ". That's " + reclaimable + " reclaimable hours.",
    "Block 3 hours of deep work tomorrow morning. Phone in another room. Treat it like a client appointment with your future self.",
    "Re-audit in 14 days. If your total hasn't dropped by at least 10 hours, you're not killing enough."
  ];
  return {
    totalHours: total, lowValuePct: lowPct, topSink: top.name, topSinkHours: top.hours,
    bandLabel, bandText, insights, actions, activities: activities.map((a) => ({ name: a.name, hours: a.hours, worth: a.worth, action: a.filter || "keep" })),
    breakdown: { eliminated, automated, templated, delegated, kept, reclaimable }
  };
}

function auditEmailHtml(link, result, name, unsubToken, origin) {
  return emailShell(
    "Your 15-Hour Workweek Audit is ready ⏱",
    "<p>" + escHtml(name) + ", you mapped your week. Here is your personal audit.</p>"
    + "<p><b>" + result.totalHours + " hours/week — " + escHtml(result.bandLabel) + ".</b> " + escHtml(result.bandText) + "</p>"
    + "<p>" + result.lowValuePct + "% of your week is low-value work. Biggest time sink: " + escHtml(result.topSink) + " (" + result.topSinkHours + "h).</p>"
    + '<p><a href="' + link + '" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;">Open my printable audit →</a></p>'
    + '<p style="font-size:13px;">Or paste this link into your browser:<br><code>' + link + '</code></p>'
    + '<p style="font-size:13px;color:#6d5f7a;">The page has a Print / Save as PDF button. This is your private copy — keep the link.</p>'
    + unsubFooter(unsubToken, origin)
  );
}

async function auditSubmit(request, env) {
  const body = await readJson(request);
  if (cleanText(body.website, 60)) return json({ ok: true, token: "", url: "" });
  const email = cleanText(body.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (body.consent !== true && body.consent !== 1 && body.consent !== "1") return json({ error: "Please tick the consent box so we can email your report." }, 400);
  const name = cleanText(body.name, 80) || email.split("@")[0];
  const raw = body.answers;
  if (!raw || !Array.isArray(raw.activities) || raw.activities.length < 3) return json({ error: "Map at least 3 activities." }, 400);
  const activities = raw.activities.map((a) => ({
    name: cleanText(a.name, 80) || "Activity",
    hours: Math.max(0, Math.min(168, Number(a.hours) || 0)),
    worth: ["yes", "sort of", "no"].includes(a.worth) ? a.worth : "sort of",
    filter: ["keep", "eliminate", "automate", "template", "delegate"].includes(a.filter) ? a.filter : "keep"
  }));
  const ip = clientIp(request);
  try {
    const recent = await env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_lead_submissions WHERE email = ? AND created_at >= datetime('now','-60 seconds')").bind(email).first();
    if (countValue(recent) > 0) return json({ error: "That report was just created. Check your inbox." }, 429);
  } catch (exc) { console.error("lead rate-limit check failed", exc); }
  const result = auditResult(activities);
  const token = randomHex(16);
  const unsubToken = randomHex(16);
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_lead_submissions (token, magnet, email, name, answers, result, consent, consent_version, unsub_token, ip) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)"
    ).bind(token, "audit", email, name, JSON.stringify({ activities }), JSON.stringify(result), CONSENT_VERSION, unsubToken, ip.slice(0, 64)).run();
  } catch (exc) {
    console.error("lead submission insert failed", exc);
    return json({ error: "We couldn't save your result. Please try again." }, 500);
  }
  const origin = env.SITE_URL || SITE_URL;
  const link = origin + "/tools/audit-result.html?t=" + token;
  const text = name + ", you mapped " + result.totalHours + " hours/week. " + result.lowValuePct + "% is low-value work. Biggest time sink: " + result.topSink + " (" + result.topSinkHours + "h). Open your audit: " + link;
  const emailed = await sendPurchaseEmail(env, email, "Your 15-Hour Workweek Audit is ready ⏱", auditEmailHtml(link, result, name, unsubToken, origin), text, "lead_audit");
  return json({ ok: true, token, url: link, emailed });
}

// ---------- Interactive lead magnet: One-Offer Clarity Worksheet ----------
function clarityResult(offers, picks, result, resultHours, resultValue, premiumPrice, killList) {
  const filled = offers.filter((o) => (o.name || "").trim());
  const rates = filled.map((o) => ({ name: o.name, price: Number(o.price) || 0, hours: Number(o.hours) || 0, revenue: Number(o.revenue) || 0, rate: (Number(o.hours) || 0) > 0 ? Math.round((Number(o.price) / Number(o.hours)) * 100) / 100 : 0 }));
  const best = rates.length ? rates.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;
  const totalRev = filled.reduce((s, o) => s + (Number(o.revenue) || 0), 0);
  const floor = resultValue > 0 ? Math.round(resultValue / 10) : 0;
  const recommended = best ? best.name : "";
  let bandLabel, bandText;
  if (filled.length === 0) { bandLabel = "No offers yet"; bandText = "List your offers above to see your clarity report."; }
  else if (filled.length === 1) { bandLabel = "One offer — good start"; bandText = "You already have focus. Now price it premium and build the machine that delivers it."; }
  else if (best && best.rate > 0) { bandLabel = "Your one offer: " + best.name; bandText = "Highest effective rate at " + best.rate + "/hr. Everything else on the kill list is noise."; }
  else { bandLabel = "Calculate your rates"; bandText = "Add price and hours per delivery so we can find your most profitable offer."; }
  const insights = [];
  if (filled.length >= 3) insights.push("You listed " + filled.length + " offers. That's a menu, not a business. Menus don't scale; offers do.");
  if (rates.some((r) => r.rate > 0 && r.rate < 20)) insights.push("At least one offer earns under 20/hr. That offer is costing you money — kill it or reprice it.");
  if (best) insights.push("Your most profitable offer is " + best.name + " at " + best.rate + "/hr. That's where your energy should go.");
  if (totalRev > 0) insights.push("Total 90-day revenue across all offers: " + totalRev + ". If one offer dominates, that's your answer.");
  if (insights.length === 0) insights.push("Fill in price and hours for each offer so we can calculate your effective hourly rates.");
  const actions = [
    "Make " + (recommended || "your best offer") + " your single offer. Remove everything else from your website, bio, and pitch.",
    "Set your premium price at " + (premiumPrice || floor || "your chosen price") + ". Take the value, divide by 10 — that's your floor.",
    "When a past client asks for the old thing, say: \"I don't offer that anymore — but here's what I do now, and it's better.\""
  ];
  return {
    offers: rates, recommended, totalRevenue: totalRev, floor, bandLabel, bandText, insights, actions,
    killList: killList || "List the offers you're killing so you can't quietly revive them.",
    result: result || "", resultHours: resultHours || 0, resultValue: resultValue || 0, premiumPrice: premiumPrice || 0
  };
}

function clarityEmailHtml(link, result, name, unsubToken, origin) {
  return emailShell(
    "Your One-Offer Clarity Report is ready 🎯",
    "<p>" + escHtml(name) + ", you found your one offer. Here is your personal report.</p>"
    + "<p><b>" + escHtml(result.recommended || "Your one offer") + " — " + escHtml(result.bandLabel) + ".</b> " + escHtml(result.bandText) + "</p>"
    + "<p>" + (result.offers || []).length + " offers mapped. Total 90-day revenue: " + (result.totalRevenue || 0) + ".</p>"
    + '<p><a href="' + link + '" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;">Open my printable report →</a></p>'
    + '<p style="font-size:13px;">Or paste this link into your browser:<br><code>' + link + '</code></p>'
    + '<p style="font-size:13px;color:#6d5f7a;">The page has a Print / Save as PDF button. This is your private copy — keep the link.</p>'
    + unsubFooter(unsubToken, origin)
  );
}

async function claritySubmit(request, env) {
  const body = await readJson(request);
  if (cleanText(body.website, 60)) return json({ ok: true, token: "", url: "" });
  const email = cleanText(body.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (body.consent !== true && body.consent !== 1 && body.consent !== "1") return json({ error: "Please tick the consent box so we can email your report." }, 400);
  const name = cleanText(body.name, 80) || email.split("@")[0];
  const a = body.answers || {};
  const offers = Array.isArray(a.offers) ? a.offers : [];
  const picks = Array.isArray(a.picks) ? a.picks : [];
  const ip = clientIp(request);
  try {
    const recent = await env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_lead_submissions WHERE email = ? AND created_at >= datetime('now','-60 seconds')").bind(email).first();
    if (countValue(recent) > 0) return json({ error: "That report was just created. Check your inbox." }, 429);
  } catch (exc) { console.error("lead rate-limit check failed", exc); }
  const result = clarityResult(offers, picks, a.result || "", Number(a.resultHours) || 0, Number(a.resultValue) || 0, Number(a.premiumPrice) || 0, cleanText(a.killList, 2000));
  const token = randomHex(16);
  const unsubToken = randomHex(16);
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_lead_submissions (token, magnet, email, name, answers, result, consent, consent_version, unsub_token, ip) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)"
    ).bind(token, "clarity", email, name, JSON.stringify(a), JSON.stringify(result), CONSENT_VERSION, unsubToken, ip.slice(0, 64)).run();
  } catch (exc) {
    console.error("lead submission insert failed", exc);
    return json({ error: "We couldn't save your result. Please try again." }, 500);
  }
  const origin = env.SITE_URL || SITE_URL;
  const link = origin + "/tools/clarity-result.html?t=" + token;
  const text = name + ", your one offer: " + (result.recommended || "your best offer") + ". " + (result.offers || []).length + " offers mapped. Open your clarity report: " + link;
  const emailed = await sendPurchaseEmail(env, email, "Your One-Offer Clarity Report is ready 🎯", clarityEmailHtml(link, result, name, unsubToken, origin), text, "lead_clarity");
  return json({ ok: true, token, url: link, emailed });
}

async function leadResult(request, env) {
  const token = String(new URL(request.url).searchParams.get("t") || "").slice(0, 64);
  if (!/^[a-f0-9]{32}$/.test(token)) return json({ error: "not found" }, 404);
  const row = await env.DB.prepare(
    "SELECT magnet, name, answers, result, created_at FROM softlife_lead_submissions WHERE token = ?"
  ).bind(token).first();
  if (!row) return json({ error: "not found" }, 404);
  const res = json({
    magnet: row.magnet,
    name: row.name,
    answers: JSON.parse(row.answers || "[]"),
    result: JSON.parse(row.result || "{}"),
    created_at: row.created_at
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function countValue(result) {
  return result && result.results && result.results[0] ? Number(result.results[0].c || 0) : 0;
}

async function sha256Hex(value) {
  const bits = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(bits));
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(saltHex),
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}
